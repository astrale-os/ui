import type { ReactNode, SVGProps } from 'react'

type ControlIconProps = SVGProps<SVGSVGElement>

function controlIcon(paths: ReactNode) {
  return function ControlIcon({ children, ...props }: ControlIconProps) {
    return (
      <svg
        data-slot="control-icon"
        aria-hidden="true"
        fill="none"
        focusable="false"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        {...props}
      >
        {paths}
        {children}
      </svg>
    )
  }
}

const CheckIcon = controlIcon(<path d="m5 12 4 4L19 6" />)
const CircleCheckIcon = controlIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </>,
)
const ChevronDownIcon = controlIcon(<path d="m6 9 6 6 6-6" />)
const ChevronUpIcon = controlIcon(<path d="m18 15-6-6-6 6" />)
const ChevronLeftIcon = controlIcon(<path d="m15 18-6-6 6-6" />)
const ChevronRightIcon = controlIcon(<path d="m9 18 6-6-6-6" />)
const CircleIcon = controlIcon(<circle cx="12" cy="12" r="6" />)
const GripVerticalIcon = controlIcon(
  <>
    <circle cx="9" cy="6" fill="currentColor" r="1" stroke="none" />
    <circle cx="15" cy="6" fill="currentColor" r="1" stroke="none" />
    <circle cx="9" cy="12" fill="currentColor" r="1" stroke="none" />
    <circle cx="15" cy="12" fill="currentColor" r="1" stroke="none" />
    <circle cx="9" cy="18" fill="currentColor" r="1" stroke="none" />
    <circle cx="15" cy="18" fill="currentColor" r="1" stroke="none" />
  </>,
)
const Loader2Icon = controlIcon(<path d="M21 12a9 9 0 1 1-6.22-8.56" />)
const InfoIcon = controlIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </>,
)
const OctagonXIcon = controlIcon(
  <>
    <path d="M7.7 2h8.6L22 7.7v8.6L16.3 22H7.7L2 16.3V7.7Z" />
    <path d="m9 9 6 6m0-6-6 6" />
  </>,
)
const MinusIcon = controlIcon(<path d="M5 12h14" />)
const MoreHorizontalIcon = controlIcon(
  <>
    <circle cx="5" cy="12" fill="currentColor" r="1.4" stroke="none" />
    <circle cx="12" cy="12" fill="currentColor" r="1.4" stroke="none" />
    <circle cx="19" cy="12" fill="currentColor" r="1.4" stroke="none" />
  </>,
)
const SearchIcon = controlIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </>,
)
const TriangleAlertIcon = controlIcon(
  <>
    <path d="M10.3 3.5 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
)
const XIcon = controlIcon(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
)

const ChevronRight = ChevronRightIcon
const ChevronLeft = ChevronLeftIcon
const ChevronDown = ChevronDownIcon
const ChevronUp = ChevronUpIcon
const MoreHorizontal = MoreHorizontalIcon

export {
  CheckIcon,
  CircleCheckIcon,
  ChevronDown,
  ChevronDownIcon,
  ChevronLeft,
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  ChevronUp,
  ChevronUpIcon,
  CircleIcon,
  GripVerticalIcon,
  InfoIcon,
  Loader2Icon,
  MinusIcon,
  MoreHorizontal,
  MoreHorizontalIcon,
  OctagonXIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
}
