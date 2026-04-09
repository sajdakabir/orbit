import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const sidebarVariants = cva(
  'flex h-full flex-col shrink-0 border-r bg-[#232324] text-white',
  {
    variants: {
      variant: {
        default: '',
        collapsed: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface SidebarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'
    return (
      <Comp
        ref={ref}
        className={sidebarVariants({ variant, className })}
        {...props}
      />
    )
  },
)
Sidebar.displayName = 'Sidebar'

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-1 flex-col overflow-y-auto ${className || ''}`}
    {...props}
  />
))
SidebarContent.displayName = 'SidebarContent'

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col ${className || ''}`} {...props} />
))
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${className || ''}`}
    {...props}
  />
))
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${className || ''}`} {...props} />
))
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`flex flex-col px-2 ${className || ''}`}
    {...props}
  />
))
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={`list-none ${className || ''}`} {...props} />
))
SidebarMenuItem.displayName = 'SidebarMenuItem'

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    isActive?: boolean
  }
>(({ className, asChild = false, isActive, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={`w-full cursor-pointer flex items-center gap-2 px-3 py-2.5 text-sm outline-none transition-colors hover:text-white focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 text-white/70 rounded-lg data-[active=true]:text-white ${className || ''}`}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = 'SidebarMenuButton'

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}
