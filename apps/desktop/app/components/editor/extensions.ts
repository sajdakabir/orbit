import {
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  UpdatedImage,
  TaskList,
  TaskItem,
  HorizontalRule,
  StarterKit,
  Placeholder,
  Color,
  HighlightExtension,
  TextStyle,
} from 'novel'
import { Markdown } from 'tiptap-markdown'
import { cx } from 'class-variance-authority'

// Placeholder configuration
const placeholder = Placeholder.configure({
  placeholder: 'Type / for commands or start writing...',
})

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      'text-blue-400 underline underline-offset-[3px] hover:text-blue-300 transition-colors cursor-pointer',
    ),
  },
})

const tiptapImage = TiptapImage.configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx('rounded-lg border border-[#3a3a3b]'),
  },
})

const updatedImage = UpdatedImage.configure({
  HTMLAttributes: {
    class: cx('rounded-lg border border-[#3a3a3b]'),
  },
})

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx('not-prose pl-2'),
  },
})

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx('flex items-start my-4'),
  },
  nested: true,
})

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx('mt-4 mb-6 border-t border-[#3a3a3b]'),
  },
})

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx('list-disc list-outside leading-3 -mt-2'),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx('list-decimal list-outside leading-3 -mt-2'),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx('leading-normal -mb-2'),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx('border-l-4 border-[#007AFF] pl-4'),
    },
  },
  codeBlock: {
    HTMLAttributes: {
      class: cx(
        'rounded-sm bg-[#2A2B2E] border border-[#3a3a3b] p-5 font-mono font-medium',
      ),
    },
  },
  code: {
    HTMLAttributes: {
      class: cx(
        'rounded-md bg-[#2A2B2E] px-1.5 py-1 font-mono font-medium text-sm',
      ),
      spellcheck: 'false',
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: '#007AFF',
    width: 4,
  },
  gapcursor: false,
})

const markdownExtension = Markdown.configure({
  html: true,
  tightLists: true,
  tightListClass: 'tight',
  bulletListMarker: '-',
  linkify: false,
  breaks: false,
  transformPastedText: false,
  transformCopiedText: false,
})

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  tiptapImage,
  updatedImage,
  taskList,
  taskItem,
  horizontalRule,
  TiptapUnderline,
  TextStyle,
  Color,
  markdownExtension,
  HighlightExtension,
]
