import React, { useState, useEffect } from 'react';
import {
  Button,
  Flex,
  HStack,
  Input,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

export interface DevicePaginationControlsProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (newPageIndex: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  isDisabled?: boolean;
}

export const DevicePaginationControls: React.FC<DevicePaginationControlsProps> = ({
  pageIndex,
  pageSize,
  totalCount: _totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isDisabled = false,
}) => {
  const currentPage = pageIndex + 1;
  const [goToInput, setGoToInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setGoToInput(String(currentPage));
  }, [currentPage]);

  const canPrevious = pageIndex > 0 && !isDisabled;
  const canNext = pageIndex < totalPages - 1 && !isDisabled;

  const handleGoToSubmit = () => {
    const parsed = parseInt(goToInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed - 1);
    } else {
      setGoToInput(String(currentPage));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToSubmit();
    }
  };

  return (
    <Flex
      py={3}
      px={4}
      borderTop="1px solid"
      borderColor={themeColors.panel.border}
      bg="#ffffff"
      align="center"
      justify="space-between"
      wrap="wrap"
      gap={3}
      fontSize="12px"
      color={themeColors.text.secondary}
    >
      {/* Left Navigation: First & Prev */}
      <HStack gap={1}>
        <Button
          size="xs"
          variant="outline"
          borderColor={themeColors.panel.border}
          color={canPrevious ? themeColors.text.primary : themeColors.text.muted}
          bg={canPrevious ? '#ffffff' : '#f8fafc'}
          _hover={canPrevious ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
          disabled={!canPrevious}
          onClick={() => onPageChange(0)}
          title="First page"
          w="32px"
          h="30px"
          p={0}
          borderRadius="6px"
        >
          <Icon name="chevronsLeft" size={14} />
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderColor={themeColors.panel.border}
          color={canPrevious ? themeColors.text.primary : themeColors.text.muted}
          bg={canPrevious ? '#ffffff' : '#f8fafc'}
          _hover={canPrevious ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
          disabled={!canPrevious}
          onClick={() => onPageChange(pageIndex - 1)}
          title="Previous page"
          w="32px"
          h="30px"
          p={0}
          borderRadius="6px"
        >
          <Icon name="chevronLeft" size={14} />
        </Button>
      </HStack>

      {/* Middle Section: Page indicator, Go to Page, and Page Size Select */}
      <HStack gap={4} wrap="wrap" justify="center">
        {/* Page X of Y */}
        <Text fontSize="12px">
          Page{' '}
          <Text as="span" fontWeight="700" color={themeColors.text.title}>
            {currentPage}
          </Text>{' '}
          of{' '}
          <Text as="span" fontWeight="700" color={themeColors.text.title}>
            {totalPages}
          </Text>
        </Text>

        {/* Go to page input */}
        <HStack gap={1.5}>
          <Text fontSize="12px">Go to page</Text>
          <Input
            size="xs"
            w="54px"
            h="28px"
            textAlign="center"
            value={goToInput}
            onChange={(e) => setGoToInput(e.target.value)}
            onBlur={handleGoToSubmit}
            onKeyDown={handleKeyDown}
            disabled={isDisabled || totalPages <= 1}
            borderColor={themeColors.input.border}
            borderRadius="4px"
            fontSize="12px"
          />
        </HStack>

        {/* Show Page Size Dropdown */}
        <HStack gap={1.5}>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
            disabled={isDisabled}
            style={{
              fontSize: '12px',
              height: '28px',
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '4px',
              border: `1px solid ${themeColors.input.border}`,
              backgroundColor: '#ffffff',
              color: themeColors.text.primary,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {[10, 20, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </HStack>
      </HStack>

      {/* Right Navigation: Next & Last */}
      <HStack gap={1}>
        <Button
          size="xs"
          variant="outline"
          borderColor={themeColors.panel.border}
          color={canNext ? themeColors.text.primary : themeColors.text.muted}
          bg={canNext ? '#ffffff' : '#f8fafc'}
          _hover={canNext ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
          disabled={!canNext}
          onClick={() => onPageChange(pageIndex + 1)}
          title="Next page"
          w="32px"
          h="30px"
          p={0}
          borderRadius="6px"
        >
          <Icon name="chevronRight" size={14} />
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderColor={themeColors.panel.border}
          color={canNext ? themeColors.text.primary : themeColors.text.muted}
          bg={canNext ? '#ffffff' : '#f8fafc'}
          _hover={canNext ? { bg: '#f1f5f9', borderColor: '#cbd5e1' } : undefined}
          disabled={!canNext}
          onClick={() => onPageChange(totalPages - 1)}
          title="Last page"
          w="32px"
          h="30px"
          p={0}
          borderRadius="6px"
        >
          <Icon name="chevronsRight" size={14} />
        </Button>
      </HStack>
    </Flex>
  );
};
