package com.muthu.CampusDocus.config;

import com.muthu.CampusDocus.security.CustomOAuth2AuthorizationRequestResolver;
import com.muthu.CampusDocus.security.CustomOAuth2UserService;
import com.muthu.CampusDocus.security.CustomOidcUserService;
import com.muthu.CampusDocus.security.OAuth2AuthenticationSuccessHandler;
import com.muthu.CampusDocus.security.RestAuthenticationEntryPoint;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final com.muthu.CampusDocus.security.HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          CustomOidcUserService customOidcUserService,
                          OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
                          RestAuthenticationEntryPoint restAuthenticationEntryPoint,
                          ClientRegistrationRepository clientRegistrationRepository,
                          com.muthu.CampusDocus.security.HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.customOidcUserService = customOidcUserService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.cookieAuthorizationRequestRepository = cookieAuthorizationRequestRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable()) // Rely on SameSite=Lax HttpOnly session cookies
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public routes
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/me", "/api/health").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**", "/error").permitAll()
                        // Protected APIs
                        .requestMatchers("/api/user/**", "/api/users/**", "/api/drive/**", "/api/documents/**",
                                "/api/mentorship/**", "/api/admin/**", "/api/announcements/**",
                                "/api/notifications/**", "/api/friends/**").authenticated()
                        .requestMatchers("/api/auth/logout").permitAll()
                        // Any other request requires authentication
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authEndpoint -> authEndpoint
                                .authorizationRequestResolver(
                                        new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository)
                                )
                                .authorizationRequestRepository(cookieAuthorizationRequestRepository)
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                                .oidcUserService(customOidcUserService)
                        )
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            logger.error("OAuth2 authentication failure encountered: ", exception);
                            String errorMsg = URLEncoder.encode(
                                    exception.getMessage() != null ? exception.getMessage() : "OAuth2 authentication failed",
                                    StandardCharsets.UTF_8
                            );
                            response.sendRedirect(cleanFrontendUrl(frontendUrl) + "/login?error=" + errorMsg);
                        })
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID", "campusdocs_oauth2_req", "campusdocs_redirect_uri")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.getWriter().write("{\"success\":true,\"message\":\"Logged out successfully\"}");
                        })
                );

        return http.build();
    }

    private String cleanFrontendUrl(String url) {
        if (url == null || url.isBlank()) {
            return "http://localhost:5173";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app",
                "https://*.onrender.com"
        ));
        config.setAllowedOrigins(List.of(
                frontendUrl,
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8080"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
