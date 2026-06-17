import type { SVGProps } from 'react'

const I = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
)

export const MicIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </I>
)

export const MicOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <line x1="2" x2="22" y1="2" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 12 5" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </I>
)

export const VolumeIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </I>
)

export const VolumeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </I>
)

export const StopIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <rect width="14" height="14" x="5" y="5" rx="2" fill="currentColor" stroke="none" />
  </I>
)

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
  </I>
)

export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m15 18-6-6 6-6" />
  </I>
)

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m9 18 6-6-6-6" />
  </I>
)

export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </I>
)

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </I>
)

export const HistoryIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </I>
)

export const CrownIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
    <path d="M5 21h14" />
  </I>
)

export const CopyIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </I>
)

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </I>
)

export const SendIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </I>
)

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </I>
)

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </I>
)

export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </I>
)

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 12h14M12 5v14" />
  </I>
)

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M20 6 9 17l-5-5" />
  </I>
)

export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
  </I>
)

export const HeadphonesIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  </I>
)

export const PaletteIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </I>
)

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </I>
)

export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M10.273 4.147a2 2 0 1 1 3.454 0c.465.183.863.349 1.209.524C18.028 6.028 18 8.14 18 10c0 .685.117 1.136.343 1.6.27.553.698 1.075 1.329 1.861.442.552.493 1.331-.082 1.914a4 4 0 0 1-2.09 1.107l-.698.146a1 1 0 0 0-.802.968V19a2 2 0 1 1-4 0v-.731A1 1 0 0 0 11 17.27H8.5a1 1 0 0 0-.8.4l-.9 1.2a1 1 0 1 1-1.6-1.2l.9-1.2a3 3 0 0 1 2.4-1.2H11a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1H6a1 1 0 0 1 0-2h5a1 1 0 0 0 1-1V6a1 1 0 0 1 1-1z" />
  </I>
)

export const LogoutIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </I>
)

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </I>
)

export const CodeIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
  </I>
)

export const LanguageIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </I>
)

export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </I>
)

export const ChatBubbleIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </I>
)

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </I>
)
