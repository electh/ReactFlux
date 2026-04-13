const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.8,
}

export const LayoutCombinedIcon = ({ className }) => (
  <svg aria-hidden="true" className={className} height="1em" viewBox="0 0 20 20" width="1em">
    <rect height="8.5" rx="1.8" width="13.5" x="3.25" y="4" {...iconProps} />
    <path d="M2.75 15.5h14.5" {...iconProps} />
    <path d="M7.25 15.5l.65-1.8h4.2l.65 1.8" {...iconProps} />
  </svg>
)

export const LayoutColumnIcon = ({ className }) => (
  <svg aria-hidden="true" className={className} height="1em" viewBox="0 0 20 20" width="1em">
    <rect height="13.5" rx="2.2" width="14.5" x="2.75" y="3.25" {...iconProps} />
    <path d="M9.8 4.4v11.2" {...iconProps} />
  </svg>
)
