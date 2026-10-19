import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={8}
          minH="400px"
          bg="#ffffff"
          borderRadius="8px"
          border="1px solid #fee2e2"
          boxShadow="sm"
          m={4}
        >
          <VStack gap={4} maxW="700px" textAlign="center">
            <Box
              w="48px"
              h="48px"
              borderRadius="50%"
              bg="#fee2e2"
              color="#dc2626"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="24px"
              fontWeight="bold"
            >
              !
            </Box>
            <Text fontSize="18px" fontWeight="700" color="#0f172a">
              {this.props.fallbackTitle || 'A rendering error occurred in this view'}
            </Text>
            <Text
              fontSize="13px"
              color="#dc2626"
              fontFamily="monospace"
              bg="#fef2f2"
              p={3}
              borderRadius="6px"
              w="100%"
              textAlign="left"
              overflowX="auto"
            >
              {this.state.error?.message || String(this.state.error)}
            </Text>
            {this.state.error?.stack && (
              <Box
                as="pre"
                fontSize="11px"
                color="#64748b"
                bg="#f8fafc"
                p={3}
                borderRadius="6px"
                maxH="200px"
                overflowY="auto"
                w="100%"
                textAlign="left"
              >
                {this.state.error.stack}
              </Box>
            )}
            <Button
              size="sm"
              bg="#0284c7"
              color="#ffffff"
              _hover={{ opacity: 0.9 }}
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </VStack>
        </Flex>
      );
    }

    return this.props.children;
  }
}
