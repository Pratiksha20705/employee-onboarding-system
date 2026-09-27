package com.onboardflow.service;

import com.onboardflow.dto.CandidateRequest;
import com.onboardflow.dto.CandidateSelfUpdateRequest;
import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.User;
import com.onboardflow.exception.BusinessRuleException;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Set;

@Service
public class CandidateService {

    // Statuses in which the candidate's own profile fields may still be edited
    // (by the candidate) or (re)submitted for review.
    private static final Set<String> EDITABLE_STATUSES = Set.of("DRAFT", "REJECTED");
    // Statuses in which HR may act (verify/reject) on a submission.
    private static final Set<String> REVIEWABLE_STATUSES = Set.of("SUBMITTED", "UNDER_REVIEW");

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CandidateRepository repo;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public CandidateService(CandidateRepository repo, ActivityLogService activityLogService,
                             UserRepository userRepository, PasswordEncoder passwordEncoder,
                             NotificationService notificationService) {
        this.repo = repo;
        this.activityLogService = activityLogService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    public List<Candidate> search(String search, String status, String department) {
        Specification<Candidate> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("firstName")), like),
                    cb.like(cb.lower(root.get("lastName")), like),
                    cb.like(cb.lower(root.get("email")), like)
            ));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (department != null && !department.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("department"), department));
        }
        return repo.findAll(spec);
    }

    public Candidate getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));
    }

    /**
     * Normalizes an email for storage and lookup: trims incidental
     * whitespace (easy to introduce via copy/paste and invisible in a text
     * input) and lower-cases it, so the same address always compares equal
     * regardless of how it was typed. Applied everywhere an email is written
     * (candidate profile, login account) and read back (AuthService.login),
     * so a candidate's portal login can never silently mismatch the address
     * HR entered for them.
     */
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public Candidate create(CandidateRequest req) {
        Candidate c = Candidate.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(normalizeEmail(req.getEmail()))
                .phone(req.getPhone())
                .address(req.getAddress())
                .dateOfBirth(req.getDateOfBirth())
                .department(req.getDepartment())
                .position(req.getPosition())
                .expectedJoiningDate(req.getExpectedJoiningDate())
                .status("SELECTED")
                .stage("SELECTED")
                .build();
        Candidate saved = repo.save(c);
        activityLogService.log(saved.getId(), "Candidate Created");
        return saved;
    }

    public Candidate update(Long id, CandidateRequest req) {
        Candidate c = getById(id);
        String oldEmail = c.getEmail();
        String newEmail = normalizeEmail(req.getEmail());

        c.setFirstName(req.getFirstName());
        c.setLastName(req.getLastName());
        c.setEmail(newEmail);
        c.setPhone(req.getPhone());
        c.setAddress(req.getAddress());
        c.setDateOfBirth(req.getDateOfBirth());
        c.setDepartment(req.getDepartment());
        c.setPosition(req.getPosition());
        c.setExpectedJoiningDate(req.getExpectedJoiningDate());

        // Keep the candidate's portal login (if one exists) linked to this
        // profile. The CANDIDATE account is matched to this row purely by
        // email (see MeController/hasLoginAccount), so if HR corrects/changes
        // the candidate's email here without also updating the User row, the
        // candidate's own login silently stops resolving to this profile and
        // HR's "has login account" check starts lying. Keep the two in sync.
        if (!newEmail.equals(oldEmail)) {
            syncLoginEmailOnCandidateEmailChange(oldEmail, newEmail);
        }

        return repo.save(c);
    }

    /**
     * When a candidate's email is changed on their profile, propagate that to
     * their existing CANDIDATE login account (if any) so the two stay linked.
     * Refuses the change if it would collide with a different account's email,
     * rather than silently orphaning either record.
     */
    private void syncLoginEmailOnCandidateEmailChange(String oldEmail, String newEmail) {
        userRepository.findByEmail(oldEmail).ifPresent(loginUser -> {
            if (!"CANDIDATE".equals(loginUser.getRole())) {
                // Not this candidate's own login account - nothing to relink.
                return;
            }
            userRepository.findByEmail(newEmail).ifPresent(existing -> {
                throw new BusinessRuleException(
                        "Can't change the candidate's email to " + newEmail
                                + " - that address is already linked to another account.");
            });
            loginUser.setEmail(newEmail);
            userRepository.save(loginUser);
        });
    }

    public void delete(Long id) {
        Candidate c = getById(id);
        repo.delete(c);
    }

    // ---------------------------------------------------------------------
    // Candidate self-service verification workflow (additive; does not touch
    // the existing status/stage recruiter pipeline used above).
    // ---------------------------------------------------------------------

    public Candidate getByEmail(String email) {
        return repo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No candidate profile found for this account"));
    }

    /**
     * Candidate editing their own personal information. Department/position/status
     * are untouched. Only allowed while the profile is still editable (DRAFT or
     * REJECTED) - once it's SUBMITTED/UNDER_REVIEW/VERIFIED it's locked server-side,
     * not just in the UI.
     */
    public Candidate updateSelf(Long id, CandidateSelfUpdateRequest req) {
        Candidate c = getById(id);
        if (!EDITABLE_STATUSES.contains(c.getVerificationStatus())) {
            throw new BusinessRuleException(
                    "Your profile can't be edited while it's " + c.getVerificationStatus().toLowerCase().replace('_', ' ') + ".");
        }
        c.setFirstName(req.getFirstName());
        c.setLastName(req.getLastName());
        c.setPhone(req.getPhone());
        c.setAddress(req.getAddress());
        c.setDateOfBirth(req.getDateOfBirth());
        return repo.save(c);
    }

    /**
     * Candidate submits their onboarding information for HR review.
     * Valid only from DRAFT (first submission) or REJECTED (resubmission after
     * HR sent it back). This is the only place SUBMITTED is entered from.
     */
    public Candidate submitForVerification(Long id) {
        Candidate c = getById(id);
        if (!EDITABLE_STATUSES.contains(c.getVerificationStatus())) {
            throw new BusinessRuleException(
                    "Your profile can't be submitted while it's " + c.getVerificationStatus().toLowerCase().replace('_', ' ') + ".");
        }
        c.setVerificationStatus("SUBMITTED");
        c.setVerificationRejectionReason(null);
        Candidate saved = repo.save(c);
        activityLogService.log(id, "Candidate submitted onboarding profile for review");
        // Notify HR - this is the only place SUBMITTED is entered from (see
        // the guard above), so a candidate submitting once produces exactly
        // one HR notification, no matter how many times the frontend re-renders.
        String fullName = (saved.getFirstName() + " " + saved.getLastName()).trim();
        notificationService.notifyHr(saved.getId(), "CANDIDATE_SUBMISSION", "New Candidate Submission",
                fullName + " has submitted their onboarding information and documents for verification.");
        return saved;
    }

    /** HR opens a submission that is waiting on them; move it into active review. */
    public Candidate markUnderReviewIfSubmitted(Candidate c) {
        if ("SUBMITTED".equals(c.getVerificationStatus())) {
            c.setVerificationStatus("UNDER_REVIEW");
            return repo.save(c);
        }
        return c;
    }

    /**
     * HR approves the candidate's submitted onboarding information.
     * Valid only from SUBMITTED or UNDER_REVIEW.
     */
    public Candidate verifySubmission(Long id) {
        Candidate c = getById(id);
        if (!REVIEWABLE_STATUSES.contains(c.getVerificationStatus())) {
            throw new BusinessRuleException(
                    "Only a submitted profile can be verified (current status: " + c.getVerificationStatus() + ").");
        }
        c.setVerificationStatus("VERIFIED");
        c.setVerificationRejectionReason(null);
        Candidate saved = repo.save(c);
        activityLogService.log(id, "HR verified candidate's onboarding profile");
        return saved;
    }

    /**
     * HR rejects the candidate's submitted onboarding information, with a reason.
     * Valid only from SUBMITTED or UNDER_REVIEW.
     */
    public Candidate rejectSubmission(Long id, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("Rejection reason is required");
        }
        Candidate c = getById(id);
        if (!REVIEWABLE_STATUSES.contains(c.getVerificationStatus())) {
            throw new BusinessRuleException(
                    "Only a submitted profile can be rejected (current status: " + c.getVerificationStatus() + ").");
        }
        c.setVerificationStatus("REJECTED");
        c.setVerificationRejectionReason(reason);
        Candidate saved = repo.save(c);
        activityLogService.log(id, "HR rejected candidate's onboarding profile: " + reason);
        return saved;
    }

    // ---------------------------------------------------------------------
    // Linking a candidate profile to a CANDIDATE login account. The portal
    // (MeController) already resolves "my profile" by matching the logged-in
    // user's email to a Candidate row, so linking is just: make sure a User
    // with that email and role CANDIDATE exists.
    // ---------------------------------------------------------------------

    /** Whether a CANDIDATE login already exists for this candidate's email. */
    public boolean hasLoginAccount(Candidate c) {
        return userRepository.findByEmail(normalizeEmail(c.getEmail())).isPresent();
    }

    /**
     * HR creates the CANDIDATE login account for an existing candidate profile,
     * linked by email. Never overwrites an existing account. Returns the
     * temporary password so HR can share it with the candidate (it can't be
     * retrieved again afterwards, since only its BCrypt hash is stored).
     */
    public String createLoginAccount(Long id, String requestedPassword) {
        Candidate c = getById(id);
        // Normalize defensively even though create()/update() already store a
        // normalized Candidate.email - this guarantees the User row we're
        // about to write can never end up mismatched with what
        // AuthService.login() looks up, even for a Candidate row that existed
        // before normalization was introduced.
        String email = normalizeEmail(c.getEmail());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessRuleException("A login account already exists for " + email);
        }
        String password = (requestedPassword != null && !requestedPassword.isBlank())
                ? requestedPassword
                : generateTempPassword();
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName((c.getFirstName() + " " + c.getLastName()).trim())
                .role("CANDIDATE")
                .build();
        userRepository.save(user);
        activityLogService.log(id, "HR created a candidate portal login for " + email);
        return password;
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder("Cand@");
        for (int i = 0; i < 6; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    /**
     * Emails (normalized, as stored) that already have a CANDIDATE portal
     * login. Used by the HR candidate list so it can show "Create Portal
     * Access" vs. "Portal Access Created" per row without one lookup per
     * candidate.
     */
    public Set<String> candidateLoginEmails() {
        return userRepository.findByRole("CANDIDATE").stream()
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toSet());
    }
}
