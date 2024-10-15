"use client";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Text } from "@tiptap/extension-text";

type Props = {
    subject: string;
    setSubject: (subject: string) => void;

    toValues: { label: string, value: string }[];
    ccValues: { label: string, value: string }[];
    to: string[]

    setToValues: (values: { label: string, value: string }[]) => void;
    setCcValues: (values: { label: string, value: string }[]) => void;

    handleSend: (value: string) => void;
    isSending: boolean;

    defaultToolbarExpanded?: boolean;
};

import React, { useEffect, useState } from "react";
import EditorMenuBar from "./editor-menubar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TagInput from "./tag-input";
import { Input } from "@/components/ui/input";
import AIComposeButton from "./ai-compose-button";
import {generate} from './action';
import { readStreamableValue } from "ai/rsc";

const EmailEditor = ({subject, setCcValues, setSubject, toValues, ccValues, to, setToValues, handleSend, isSending, defaultToolbarExpanded}: Props) => {
  const [value, setValue] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(defaultToolbarExpanded ?? false);
  const [token, setToken] = useState<string>('')

  const aiGenerate = async (value: string) => {
    const {output} = await generate(value);
    for await (const token of readStreamableValue(output)) {
      if(token) {
        setToken(token)
      }
    }
  }

  const CustomText = Text.extend({
    addKeyboardShortcuts() {
      return {
        "Meta-A": () => {
          aiGenerate(this.editor.getText());
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    autofocus: false,
    extensions: [StarterKit, CustomText],
    onUpdate: ({ editor }) => {
      setValue(editor.getHTML());
    },
  });

  useEffect(() => {
    editor?.commands?.insertContent(token);
  }, [editor, token])

  const onGenerate = (token: string) => {
    console.log(token);
    editor?.commands?.insertContent(token);
  }

  if (!editor) return null;

  return (
    <div>
      <div className="flex p-4 py-2 border-b">
        <EditorMenuBar editor={editor} />
      </div>

      <div className="space-y-2 p-4 pb-0">
        {expanded && (
          <>
            <TagInput
              label="To"
              onChange={setToValues}
              placeholder="Add Recipients"
              value={toValues}
            />
            <TagInput
              label="Cc"
              onChange={setCcValues}
              placeholder="Add Recipients"
              value={ccValues}
            />
            <Input id="subject" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </>
        )}

        <div className="flex items-center gap-2">
          <div
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="font-medium text-green-600">Draft </span>
            <span>to {to.join(', ')}</span>
          </div>
        </div>
        {/*@ts-ignore*/}
        <AIComposeButton isComposing={defaultToolbarExpanded} onGenerate={onGenerate} />
      </div>

      <div className="prose w-full px-4">
        <EditorContent editor={editor} value={value} />
      </div>
      <Separator />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm">
          Tip: Press{" "}
          <kbd className="border-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
            Cmd+A
          </kbd>{" "}
          for AI autocomplete
        </span>
        <Button onClick={async () => {
            editor?.commands.clearContent();
            await handleSend(value);
        }} disabled={isSending}>Send</Button>
      </div>
    </div>
  );
};

export default EmailEditor;
