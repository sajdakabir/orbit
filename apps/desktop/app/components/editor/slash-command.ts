import React from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  CheckSquare,
  Code,
  Quote,
  Minus,
} from 'lucide-react'
import { createSuggestionItems, Command, renderItems } from 'novel'

export const suggestionItems = createSuggestionItems([
  {
    title: 'Text',
    description: 'Just start typing with plain text.',
    searchTerms: ['p', 'paragraph'],
    icon: React.createElement(Text, { size: 18 }),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode('paragraph', 'paragraph')
        .run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    searchTerms: ['title', 'big', 'large', 'h1'],
    icon: React.createElement(Heading1, { size: 18 }),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    searchTerms: ['subtitle', 'medium', 'h2'],
    icon: React.createElement(Heading2, { size: 18 }),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    searchTerms: ['subtitle', 'small', 'h3'],
    icon: React.createElement(Heading3, { size: 18 }),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    searchTerms: ['unordered', 'point', 'ul'],
    icon: React.createElement(List, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    searchTerms: ['ordered', 'ol'],
    icon: React.createElement(ListOrdered, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Todo List',
    description: 'Track tasks with a todo list.',
    searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
    icon: React.createElement(CheckSquare, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax highlighting.',
    searchTerms: ['codeblock', 'code'],
    icon: React.createElement(Code, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    searchTerms: ['blockquote', 'quote'],
    icon: React.createElement(Quote, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks.',
    searchTerms: ['hr', 'horizontal', 'rule', 'divider'],
    icon: React.createElement(Minus, { size: 18 }),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
])

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
})
