package in.harshitkumar7525.RapidQuiz.security;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import in.harshitkumar7525.RapidQuiz.exception.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String USER_ID_ATTRIBUTE = "userId";

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !isProtected(request.getMethod(), request.getRequestURI());
    }

    private boolean isProtected(String method, String path) {
        if (path.equals("/quizzes") || path.equals("/quizzes/")) {
            return "POST".equalsIgnoreCase(method) || "GET".equalsIgnoreCase(method);
        }
        if (path.startsWith("/quizzes/")) {
            return "PATCH".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method);
        }
        if (path.equals("/games/create")) {
            return "POST".equalsIgnoreCase(method);
        }
        if (path.matches("^/games/[^/]+/status$")) {
            return "PATCH".equalsIgnoreCase(method);
        }
        if (path.matches("^/games/[^/]+/next-question$")) {
            return "PATCH".equalsIgnoreCase(method);
        }
        if (path.matches("^/games/[^/]+$")) {
            return "GET".equalsIgnoreCase(method);
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || header.isBlank()) {
            unauthorized(response, "authorization header is required");
            return;
        }

        String token = header.startsWith("Bearer ") ? header.substring(7) : header;
        try {
            String userId = jwtUtil.validateAndGetUserId(token);
            request.setAttribute(USER_ID_ATTRIBUTE, userId);
        } catch (UnauthorizedException e) {
            unauthorized(response, "invalid token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}