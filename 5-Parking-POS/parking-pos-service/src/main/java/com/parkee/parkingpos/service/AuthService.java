// AuthService.java - Interface
package com.parkee.parkingpos.service;

import com.parkee.parkingpos.dto.*;
import java.util.List;
import java.util.Map;

public interface AuthService {

    /**
     * Authenticate user dan generate tokens
     */
    LoginResponseDto login(LoginRequestDto request);

    /**
     * Refresh access token menggunakan refresh token
     */
    TokenResponseDto refreshToken(String refreshToken);

    /**
     * Logout user dan invalidate tokens
     */
    Map<String, Object> logout(String accessToken, String refreshToken);

    /**
     * Validate token dan return user info
     */
    Map<String, Object> validateToken(String token);

    /**
     * Get mock users untuk testing
     */
    List<Map<String, String>> getMockUsers();
}
