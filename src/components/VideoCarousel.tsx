import { t } from '@/i18n/site'
import { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@/components/icons'
import { OmarchyMark } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { RailBar, useRail } from '@/components/Rail'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { cn } from '@/lib/utils'
import { useIsNarrow } from '@/lib/use-media-query'

export type CarouselVideo = {
  id: string
  title: string
  channel: string
  thumb: string
  start?: number
}

export function VideoCarousel({
  title,
  description,
  videos,
  level = 2,
  anchor,
}: {
  title: string
  description?: string
  videos: readonly CarouselVideo[]
  level?: 2 | 3
  anchor?: string
}) {
  const narrow = useIsNarrow()
  const rail = useRail({ count: videos.length, align: 'center' })
  const { index, glideTo } = rail
  const [playing, setPlaying] = useState<string | null>(null)
  /**
   * Whether the pointer is in the rail at all. Once a video is running the
   * pointer is over a cross-origin iframe, and hover inside one of those
   * does not reach the page around it - the arrows would go and never come
   * back. Enter and leave are boundary events and still land, so they are
   * what there is to go on while something is playing.
   */
  const [pointerIn, setPointerIn] = useState(false)

  // Clamped, not wrapped. Wrapping meant the first slide's back arrow
  // glided the whole rail to the last one, whipping past everything in
  // between; the ends are ends, and the arrow that would leave one is off.
  const goTo = (i: number) =>
    glideTo(Math.max(0, Math.min(videos.length - 1, i)))

  // Leaving a slide silences it, however you left.
  useEffect(() => {
    setPlaying((current) =>
      current && current !== videos[index]?.id ? null : current,
    )
  }, [index, videos])

  /**
   * An arrow, on the video rather than beside it: sat against the edge it
   * moves towards, half way down, so the control is on the thing it acts
   * on and lands where the eye already is.
   *
   * It wears the mark the play badge wears, well down from its size, so
   * the two read as one family of control and the arrow plainly the
   * lesser of them. Held back to a wash until the rail is pointed at or an
   * arrow is tabbed to; where there is no hover to wait for, both stay up.
   * At an end of the rail the arrow that would leave it is spent.
   */
  const arrow = (side: 'previous' | 'next') => {
    const spent = side === 'previous' ? rail.atStart : rail.atEnd
    return (
      <button
        type="button"
        disabled={spent}
        aria-label={side === 'previous' ? t('Previous video') : t('Next video')}
        onClick={() => goTo(side === 'previous' ? index - 1 : index + 1)}
        className={cn(
          'relative m-3 flex size-[48px] items-center justify-center',
          'text-brand drop-shadow-[0_1px_6px_rgb(0_0_0/0.7)]',
          'transition-opacity duration-200 ease-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          spent ? 'cursor-default' : 'cursor-pointer',
          // At rest: a wash over a still, and nothing at all over a running
          // video. That one has controls of its own and did not ask for
          // these; they are gone until the pointer comes back to the rail.
          playing && !pointerIn
            ? 'pointer-events-none opacity-0'
            : spent
              ? 'pointer-events-auto opacity-20'
              : playing
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-auto [@media(hover:hover)]:opacity-60',
          // Over a still, the badge's own cue does the same job more
          // precisely - the video itself, not the bleed either side of it.
          spent
            ? '[@media(hover:hover)]:group-has-[[data-slide]:hover]/rail:opacity-20'
            : '[@media(hover:hover)]:group-has-[[data-slide]:hover]/rail:pointer-events-auto [@media(hover:hover)]:group-has-[[data-slide]:hover]/rail:opacity-100 [@media(hover:hover)]:hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
        )}
      >
        <OmarchyMark className="absolute inset-0 size-full" />
        {side === 'previous' ? (
          <ChevronLeftIcon className="relative size-4" />
        ) : (
          <ChevronRightIcon className="relative size-4" />
        )}
      </button>
    )
  }

  /**
   * The same pair, below the rail. On the narrow layout every slide is a
   * live embed, and an arrow sitting on one of those covers the player's
   * own left and right - where a tap means seek, not next - and has no
   * hover to fade back to. So down there they stay beside the rail, which
   * is where SectionActions puts every other showcase's arrows.
   */
  const arrowsBelow = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={t('Previous video')}
        disabled={rail.atStart}
        onClick={() => goTo(index - 1)}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('Next video')}
        disabled={rail.atEnd}
        onClick={() => goTo(index + 1)}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </div>
  )

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          anchor={anchor}
          title={title}
          description={description}
          level={level}
        />
      </div>

      <div
        className="group/rail relative mt-6 lg:mt-10"
        onMouseEnter={() => setPointerIn(true)}
        onMouseLeave={() => setPointerIn(false)}
      >
        <div
          ref={rail.scroller}
          {...rail.scrollerProps}
          className="rail-bare rail-column flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto select-none active:cursor-grabbing motion-reduce:scroll-auto"
          aria-roledescription="carousel"
          aria-label={title}
        >
          {videos.map((video, i) => (
            <div
              key={video.id}
              className={cn(
                'w-full shrink-0 snap-center transition-[opacity,filter] duration-300 ease-out',
                i !== index && 'opacity-40 brightness-75',
              )}
              data-slide={i}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${videos.length}: ${video.title}`}
            >
              {narrow || playing === video.id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?${new URLSearchParams(
                    {
                      ...(video.start ? { start: String(video.start) } : {}),
                      ...(playing === video.id ? { autoplay: '1' } : {}),
                    },
                  )}`}
                  title={`${video.title} by ${video.channel}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="img-outlined aspect-video w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => (i === index ? setPlaying(video.id) : goTo(i))}
                  className="group relative block w-full cursor-grab text-left active:cursor-grabbing"
                  aria-label={
                    i === index
                      ? `Play: ${video.title} by ${video.channel}`
                      : `Show: ${video.title} by ${video.channel}`
                  }
                >
                  <img
                    src={video.thumb}
                    alt=""
                    width={1280}
                    height={720}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    draggable={false}
                    className="img-outlined aspect-video w-full object-cover"
                  />
                  {i === index ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="relative flex size-[75px] cursor-pointer items-center justify-center text-brand drop-shadow-[0_1px_6px_rgb(0_0_0/0.7)] transition-opacity duration-200 ease-out [@media(hover:hover)]:opacity-60 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                        <OmarchyMark className="absolute inset-0 size-full" />
                        <PlayIcon className="relative size-[25px]" />
                      </span>
                    </span>
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                    <span className="block font-sans text-base font-medium text-white">
                      {video.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[13px] text-white/70">
                      {video.channel}
                    </span>
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
        {/* The arrows ride on the video itself, one against each edge. The
            layer carries the same rail geometry as the slides, so they line
            up with whichever slide is centred however wide the window is,
            and it lets pointers through - only the buttons catch them, so
            the rail can still be dragged between the two. */}
        <div className="rail-column pointer-events-none absolute inset-0 hidden items-center justify-between sm:flex">
          {arrow('previous')}
          {arrow('next')}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RailBar rail={rail} />
        <SectionActions>{arrowsBelow}</SectionActions>
      </div>
    </>
  )
}
