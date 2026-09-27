package com.onboardflow.config;

import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.User;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Seeds a default HR account and a demo candidate account on first boot
 * so the app is usable out of the box in local development. The credentials
 * are configurable via env vars so this never has to be a hardcoded
 * production password. Never overwrites an existing account.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.hr-email:hr@onboardflow.com}")
    private String hrEmail;

    @Value("${app.seed.hr-password:Hr@12345}")
    private String hrPassword;

    @Value("${app.seed.candidate-email:candidate@onboardflow.com}")
    private String candidateEmail;

    @Value("${app.seed.candidate-password:Candidate@12345}")
    private String candidatePassword;

    public DataInitializer(UserRepository userRepository, CandidateRepository candidateRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(hrEmail).isEmpty()) {
            User hr = User.builder()
                    .email(hrEmail)
                    .password(passwordEncoder.encode(hrPassword))
                    .fullName("HR User")
                    .role("HR")
                    .build();
            userRepository.save(hr);
            log.info("Seeded default HR account ({}). Change this password after first login.", hrEmail);
        }

        if (userRepository.findByEmail(candidateEmail).isEmpty()) {
            User candidateUser = User.builder()
                    .email(candidateEmail)
                    .password(passwordEncoder.encode(candidatePassword))
                    .fullName("Demo Candidate")
                    .role("CANDIDATE")
                    .build();
            userRepository.save(candidateUser);
            log.info("Seeded demo candidate account ({}). Change this password after first login.", candidateEmail);
        }

        // The candidate's onboarding record is matched to their login by email,
        // so a CANDIDATE user needs a matching Candidate row to have anything to see.
        if (candidateRepository.findByEmail(candidateEmail).isEmpty()) {
            Candidate demoCandidate = Candidate.builder()
                    .firstName("Demo")
                    .lastName("Candidate")
                    .email(candidateEmail)
                    .phone("")
                    .address("")
                    .department("Engineering")
                    .position("Software Engineer")
                    .expectedJoiningDate(LocalDate.now().plusDays(14))
                    .status("SELECTED")
                    .stage("SELECTED")
                    .verificationStatus("DRAFT")
                    .build();
            candidateRepository.save(demoCandidate);
            log.info("Seeded demo candidate onboarding profile for {}.", candidateEmail);
        }
    }
}
