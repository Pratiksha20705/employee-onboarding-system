package com.onboardflow.service;

import com.onboardflow.dto.LoginRequest;
import com.onboardflow.dto.LoginResponse;
import com.onboardflow.entity.User;
import com.onboardflow.repository.UserRepository;
import com.onboardflow.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        // Emails are stored normalized (trimmed + lower-cased) everywhere they're
        // written - see CandidateService.normalizeEmail(). Normalize the
        // incoming login email the same way before looking it up, so an
        // account created for "Name@Example.com" (or pasted with a stray
        // leading/trailing space, which is invisible in the input field) still
        // authenticates correctly. Root cause of "Invalid email or password"
        // for newly-created candidate logins: this lookup used to compare the
        // raw, unnormalized input against a normalized/differently-cased
        // stored value.
        String normalizedEmail = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
