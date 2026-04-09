'use client'

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  type JSONContent,
} from 'novel'
import { defaultExtensions } from './extensions'
import './editor.css'
import { slashCommand, suggestionItems } from './slash-command'

const extensions = [...defaultExtensions, slashCommand]

export const defaultEditorContent: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
}

interface EditorProps {
  initialValue?: JSONContent
  onChange: (content: JSONContent) => void
  placeholder?: string
}

const Editor = ({ initialValue, onChange, placeholder }: EditorProps) => {
  if (!initialValue) return null

  return (
    <EditorRoot>
      <EditorContent
        immediatelyRender={false}
        initialContent={initialValue}
        extensions={extensions}
        className="w-full"
        editorProps={{
          attributes: {
            class:
              'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none w-full min-h-[450px]',
            'data-placeholder': placeholder || 'Start writing...',
          },
        }}
        onUpdate={({ editor }) => {
          onChange(editor.getJSON())
        }}
      >
        {/* Slash Command Menu */}
        <EditorCommand className="border-[#3a3a3b] bg-[#2A2B2E] fixed z-9999 h-auto max-h-82.5 w-72 overflow-y-auto rounded-md border px-1 py-2 shadow-lg">
          <EditorCommandEmpty className="text-[#979899] px-2 py-1 text-sm">
            No results
          </EditorCommandEmpty>
          <EditorCommandList className="pointer-events-auto">
            {suggestionItems.map(item => (
              <EditorCommandItem
                value={item.title}
                onCommand={val => {
                  const commandProps = {
                    editor: val.editor,
                    range: val.range,
                  }
                  item.command?.(commandProps)
                }}
                className="hover:bg-[#3a3a3b] aria-selected:bg-[#3a3a3b] flex w-full cursor-pointer items-center space-x-2 rounded-md px-2 py-2 text-left"
                key={item.title}
              >
                <div className="border-[#3a3a3b] bg-[#1C1E21] flex h-10 w-10 items-center justify-center rounded-md border">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-[#979899] text-xs">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  )
}

export default Editor
