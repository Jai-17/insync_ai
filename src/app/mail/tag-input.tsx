import useThreads from "@/hooks/use-threads";
import { api } from "@/trpc/react";
import React, { useState } from "react";
import Avatar from "react-avatar";
import Select from "react-select";
import { string } from "zod";

type Props = {
  placeholder: string;
  label: string;
  onChange: (values: { label: string; value: string }[]) => void;
  value: { label: string; value: string }[];
};

const TagInput = ({
  placeholder,
  label,
  onChange,
  value,
}: Props) => {
  const { accountId } = useThreads();
  const { data: suggestions } = api.account.getSuggestions.useQuery({
    accountId,
  });
  const [inputValue, setInputValue] = useState("");

  const options = suggestions?.map((suggestion) => ({
    label: (
      <span className="flex items-center gap-2">
        <Avatar
          name={suggestion.address}
          size="25"
          textSizeRatio={2}
          round={true}
        />
        {suggestion.address}
      </span>
    ),
    value: suggestion.address,
  }));

  return (
    <div className="flex items-center rounded-md border">
      <span className="ml-3 text-sm text-gray-500">{label}</span>
      <Select
        value={value}
        className="w-full flex-1"
        onInputChange={setInputValue}
        isMulti
        //@ts-ignore
        onChange={onChange}
        //@ts-ignore
        options={inputValue ? options.concat({
            label: (
                <span className='flex items-center gap-2'>
                    <Avatar name={inputValue} size='25' textSizeRatio={2} round={true} />
                    {inputValue}
                </span>
            ), 
            value: inputValue
        }) : options}
        placeholder={placeholder}
        classNames={{
          control: () => {
            return "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:bg-transparent";
          },
          multiValue: () => {
            return "dark:!bg-gray-700";
          },
          multiValueLabel: () => {
            return "dark:text-white dark:bg-gray-700 rounded-md";
          },
        }}
        classNamePrefix="select"
      />
    </div>
  );
};

export default TagInput;