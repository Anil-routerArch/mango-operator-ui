import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Spinner,
  Image,
} from '@chakra-ui/react';
import { useAuthStore } from '@/stores/authStore';
import { themeColors } from '@/theme';
import logoDark from '@/assets/logo-dark.png';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, submitMfa, isLoading, error, mfaChallenge, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaCode, setMfaCode] = useState('');

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mfaChallenge) {
      const ok = await submitMfa(mfaCode, rememberMe).catch(() => false);
      if (ok) {
        const returnUrl = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(returnUrl, { replace: true });
      }
      return;
    }

    const ok = await login({ userId, password }, rememberMe).catch(() => false);
    if (ok) {
      const returnUrl = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(returnUrl, { replace: true });
    }
  };

  return (
    <Flex
      minH="100vh"
      w="100%"
      align="center"
      justify="center"
      bg={themeColors.canvas.bg}
      px={4}
      py={12}
    >
      <VStack gap={6} w="100%" maxW="420px" align="center">
        {/* Mango Cloud Logo above the Form */}
        <Image
          src={logoDark}
          alt="Mango Cloud"
          maxH="75px"
          maxW="260px"
          w="auto"
          h="auto"
          objectFit="contain"
        />

        <Box
          w="100%"
          bg={themeColors.panel.bg}
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="8px"
          p={8}
          boxShadow="0px 10px 25px rgba(0, 0, 0, 0.04)"
        >
          {/* Header inside Card */}
          <VStack gap={1} mb={6} align="start">
            <Heading as="h1" size="lg" color={themeColors.text.title} fontWeight="700">
              Welcome Back!
            </Heading>
            <Text fontSize="13px" color={themeColors.text.secondary}>
              Enter your email and password to sign in
            </Text>
          </VStack>

        {/* Error Notification */}
        {error && (
          <Box
            bg={themeColors.status.error.bg}
            color={themeColors.status.error.text}
            border="1px solid"
            borderColor={themeColors.status.error.border}
            borderRadius="4px"
            p={3}
            mb={5}
            fontSize="12px"
          >
            {error}
          </Box>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            {!mfaChallenge ? (
              <>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Username or Email
                  </Text>
                  <Input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="admin@ipnx.example"
                    border="1px solid"
                    borderColor={themeColors.input.border}
                    borderRadius="4px"
                    bg={themeColors.input.bg}
                    fontSize="13px"
                    px={3}
                    py={2}
                    _focus={{ borderColor: themeColors.input.focusOutline }}
                  />
                </Box>

                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Password
                  </Text>
                  <Flex>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      border="1px solid"
                      borderRight="0"
                      borderColor={themeColors.input.border}
                      borderTopLeftRadius="4px"
                      borderBottomLeftRadius="4px"
                      borderTopRightRadius="0"
                      borderBottomRightRadius="0"
                      bg={themeColors.input.bg}
                      fontSize="13px"
                      px={3}
                      py={2}
                      _focus={{ borderColor: themeColors.input.focusOutline }}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      border="1px solid"
                      borderColor={themeColors.input.border}
                      borderLeft="0"
                      borderTopRightRadius="4px"
                      borderBottomRightRadius="4px"
                      borderTopLeftRadius="0"
                      borderBottomLeftRadius="0"
                      bg={themeColors.input.bg}
                      fontSize="11px"
                      color={themeColors.text.secondary}
                      px={3}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </Flex>
                </Box>

                <HStack justify="space-between" fontSize="12px" color={themeColors.text.secondary} mt={1}>
                  <HStack as="label" cursor="pointer" gap={2}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </HStack>
                </HStack>
              </>
            ) : (
              /* MFA Challenge Screen */
              <Box>
                <Text fontSize="14px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                  Two-Factor Authentication
                </Text>
                <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
                  Enter the verification code from your {mfaChallenge.method || 'authenticator'} app:
                </Text>
                <Input
                  type="text"
                  required
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  border="1px solid"
                  borderColor={themeColors.input.border}
                  borderRadius="4px"
                  bg={themeColors.input.bg}
                  fontSize="15px"
                  textAlign="center"
                  letterSpacing="4px"
                  px={3}
                  py={2}
                />
              </Box>
            )}

            {/* Submit CTA */}
            <Button
              type="submit"
              disabled={isLoading}
              bg={themeColors.brand.primary}
              _hover={{ bg: themeColors.brand.primaryHover }}
              _active={{ bg: themeColors.brand.primaryActive }}
              color="#ffffff"
              borderRadius="4px"
              fontWeight="600"
              fontSize="14px"
              h="40px"
              mt={3}
              cursor={isLoading ? 'not-allowed' : 'pointer'}
            >
              {isLoading ? (
                <HStack gap={2}>
                  <Spinner size="xs" color="#ffffff" />
                  <span>Signing in...</span>
                </HStack>
              ) : mfaChallenge ? (
                'Verify & Continue'
              ) : (
                'Sign In'
              )}
            </Button>
          </VStack>
        </form>
      </Box>
    </VStack>
  </Flex>
);
};

export default LoginPage;
