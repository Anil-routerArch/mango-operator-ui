import React from 'react';
import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Flex,
  Toast,
  createToaster,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  overlap: true,
  max: 5,
});

export const Toaster: React.FC = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster}>
        {(toast) => (
          <Toast.Root
            key={toast.id}
            bg="#ffffff"
            color="#111b31"
            border="1px solid"
            borderColor={
              toast.type === 'error'
                ? '#fca5a5'
                : toast.type === 'success'
                ? '#86efac'
                : toast.type === 'warning'
                ? '#fcd34d'
                : '#cbd5e1'
            }
            borderRadius="8px"
            boxShadow="0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            py="12px"
            px="16px"
            minW="320px"
            maxW="480px"
          >
            {/* Status Indicator Icon */}
            {toast.type === 'loading' ? (
              <Spinner size="sm" color="#0869ff" mt="2px" flexShrink={0} />
            ) : toast.type === 'success' ? (
              <Flex
                w="22px"
                h="22px"
                borderRadius="50%"
                bg="#dcfce7"
                color="#16a34a"
                align="center"
                justify="center"
                flexShrink={0}
                mt="1px"
              >
                <Icon name="check" size={13} />
              </Flex>
            ) : toast.type === 'error' ? (
              <Flex
                w="22px"
                h="22px"
                borderRadius="50%"
                bg="#fee2e2"
                color="#dc2626"
                align="center"
                justify="center"
                flexShrink={0}
                mt="1px"
              >
                <Icon name="x" size={13} />
              </Flex>
            ) : toast.type === 'warning' ? (
              <Flex
                w="22px"
                h="22px"
                borderRadius="50%"
                bg="#fef3c7"
                color="#d97706"
                align="center"
                justify="center"
                flexShrink={0}
                mt="1px"
              >
                <Icon name="info" size={13} />
              </Flex>
            ) : (
              <Flex
                w="22px"
                h="22px"
                borderRadius="50%"
                bg="#e0f2fe"
                color="#0284c7"
                align="center"
                justify="center"
                flexShrink={0}
                mt="1px"
              >
                <Icon name="info" size={13} />
              </Flex>
            )}

            <Stack gap="2px" flex="1" maxWidth="100%" ml={1}>
              {toast.title && (
                <Toast.Title fontWeight="600" fontSize="13px" color="#0f172a" lineHeight="1.3">
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description fontSize="12px" color="#475569" lineHeight="1.4">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>

            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            <Toast.CloseTrigger cursor="pointer" color="#94a3b8" _hover={{ color: '#0f172a' }} />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};

export default Toaster;
