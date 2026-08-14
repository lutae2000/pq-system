"use client";

import type { QueryKey } from "@tanstack/react-query";

import {
  CommonSelectField,
  type CommonSelectFieldProps,
  type CommonSelectOption,
} from "@/components/common/CommonSelectField";

export type CodeRecordLike = {
  code: string;
  codeName: string;
};

export type CodeSelectFieldProps<TItem extends CodeRecordLike, TValue extends string> = Omit<
  CommonSelectFieldProps<TItem, TValue>,
  "mapOption" | "options" | "placeholder" | "placeholderDisabled" | "queryKey"
> & {
  allLabel?: string;
  codeGroup?: string;
  mapOption?: (item: TItem) => CommonSelectOption<TValue>;
  options?: readonly CommonSelectOption<TValue>[];
  placeholder?: string;
  placeholderDisabled?: boolean;
  queryKey?: QueryKey;
};

export function CodeSelectField<TItem extends CodeRecordLike, TValue extends string>({
  allLabel = "전체",
  codeGroup = "default",
  mapOption,
  placeholder,
  placeholderDisabled = false,
  queryKey,
  ...props
}: CodeSelectFieldProps<TItem, TValue>) {
  return (
    <CommonSelectField
      {...props}
      mapOption={mapOption ?? ((item) => ({ label: item.codeName, value: item.code as TValue }))}
      placeholder={placeholder ?? allLabel}
      placeholderDisabled={placeholderDisabled}
      queryKey={queryKey ?? ["code-select", codeGroup]}
    />
  );
}
