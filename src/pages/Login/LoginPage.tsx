import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { useAuthStore } from '@/stores/authStore';
import { themeColors } from '@/theme';

export const LoginPage: React.FC = () => {
  const { login, submitMfa, isLoading, error, mfaChallenge, clearError } = useAuthStore();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaCode, setMfaCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mfaChallenge) {
      await submitMfa(mfaCode, rememberMe).catch(() => {});
      return;
    }

    await login({ userId, password }, rememberMe).catch(() => {});
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
      <Box
        w="100%"
        maxW="420px"
        bg={themeColors.panel.bg}
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        p={8}
        boxShadow="0px 10px 25px rgba(0, 0, 0, 0.04)"
      >
        {/* Brand Header */}
        <VStack gap={3} mb={8} align="center">
          <HStack gap={3}>
            {/* Mango Fruit Logo */}
            <Box
              w="32px"
              h="38px"
              bg={`linear-gradient(145deg, ${themeColors.brand.mangoGradientStart}, ${themeColors.brand.mangoGradientEnd})`}
              borderRadius="70% 40% 65% 55%"
              transform="rotate(15deg)"
              position="relative"
            >
              <Box
                w="18px"
                h="8px"
                bg={themeColors.brand.mangoLeaf}
                borderRadius="100% 0"
                position="absolute"
                top="-5px"
                right="-7px"
                transform="rotate(-25deg)"
              />
            </Box>
            <Heading as="h1" size="lg" color={themeColors.text.title} fontWeight="700">
              Mango Cloud
            </Heading>
          </HStack>
          <Text fontSize="13px" color={themeColors.text.secondary}>
            MDU Operator & Access Portal
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
    </Flex>
  );
};

export default LoginPage;
