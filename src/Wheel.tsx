import { $, $$, Observable, ObservableMaybe, render, useEffect, useMemo } from 'woby'
import { use } from 'use-woby'

type MobilePickerProps = {
    options: ObservableMaybe<any[]>,
    itemHeight?: ObservableMaybe<number>,
    visibleItemCount?: ObservableMaybe<number>,
    value?: ObservableMaybe<string | number>,
    class?: JSX.Class
    header?: JSX.Element
}

export const Wheel = ({ options, itemHeight: ih, visibleItemCount: vic, value: iv, class: cls, header }: MobilePickerProps) => {

    const itemHeight = use(ih, 36)
    const visibleItemCount = use(vic, 5)
    const value = use(iv)

    const CLICK_THRESHOLD_PX = 5

    const formattedOptions = useMemo(() => $$(options).map(opt =>
        typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
    ))

    const paddingItemCount = $(0)
    let minTranslateY = 0
    let maxTranslateY = 0

    // --- State variables ---
    const selectedIndex = $(-1)
    let currentY = 0
    let startY = 0
    let startTranslateY = 0
    let startTime = 0
    let isDragging = false
    let hasMoved = false
    const rafId = $(0)
    let velocity = 0
    let lastMoveTime = 0
    let lastMoveY = 0
    let wheelSnapTimeoutId = $(0)

    const viewport = $<HTMLDivElement>()
    const list = $<HTMLUListElement>()

    useEffect(() => {
        if (typeof $$(visibleItemCount) !== 'number' || $$(visibleItemCount) <= 0)
            visibleItemCount(3)

        if ($$(visibleItemCount) % 2 === 0) {
            console.warn(`visibleItemCount (${$$(visibleItemCount)}) should be odd for symmetry. Adjusting to ${$$(visibleItemCount) + 1}.`)
            visibleItemCount($$(visibleItemCount) + 1)
        }

        paddingItemCount(Math.floor($$(visibleItemCount) / 2))


        // Recalculate scroll boundaries based on new layout
        // Need to define getTargetYForIndex before calling it here
        minTranslateY = _getTargetYForIndexUnbound($$(formattedOptions).length - 1)
        maxTranslateY = _getTargetYForIndexUnbound(0)

        snapToIndex($$(selectedIndex))
        // console.log(`Layout Updated: count=${visibleItemCount}, h=${viewportHeight}, pad=${paddingItemCount}, minY=${minTranslateY}, maxY=${maxTranslateY}`);
    })

    const viewportHeight = useMemo(() => $$(itemHeight) * $$(visibleItemCount))
    const indicatorTop = useMemo(() => ($$(viewportHeight) - $$(itemHeight)) / 2)

    // Internal helper to get target Y without index clamping, used for bounds calc
    function _getTargetYForIndexUnbound(index: number) {
        // Uses the potentially updated indicatorTop and paddingItemCount
        return $$(indicatorTop) - (index + $$(paddingItemCount)) * $$(itemHeight)
    }

    // Public getter for target Y, still used by snapToIndex etc.
    function getTargetYForIndex(index: number) {
        // Uses the potentially updated indicatorTop and paddingItemCount
        return $$(indicatorTop) - (index + $$(paddingItemCount)) * $$(itemHeight)
    }

    const pickerItemCls = 'apply h-9 flex items-center justify-center text-base text-[#555] box-border opacity-60 transition-opacity duration-[0.3s,transform] delay-[0.3s] select-none scale-90'

    // --- Populate List --- (Now uses the 'let' paddingItemCount)
    function* populateList() {
        // Top padding
        for (let i = 0; i < $$(paddingItemCount); i++)
            yield <li class={['picker-item is-padding invisible', pickerItemCls]} style={{ height: () => `${$$(itemHeight)}px` }}></li>

        // Actual items
        for (const [index, option] of $$(formattedOptions).entries()) {
            yield <li class={['picker-item', pickerItemCls]} data-index={index} data-value={option.value}
                style={{ height: () => `${$$(itemHeight)}px` }}>{option.label}</li>
        }
        // Bottom padding
        for (let i = 0; i < $$(paddingItemCount); i++)
            yield < li class={['picker-item is-padding invisible', pickerItemCls]} style={{ height: `${$$(itemHeight)}px` }}></li>
    }

    function setTranslateY(y: number) {
        if (!$$(list)) return

        // Clamp position using the potentially updated boundaries
        currentY = Math.max(minTranslateY, Math.min(maxTranslateY, y))
        $$(list).style.transform = `translateY(${currentY}px)`
        updateItemStyles()
    }

    let snapToIndexTimeout = 0
    function snapToIndex(index: number, immediate = false) {
        if (!$$(list)) return

        // Clamp index based on options length (doesn't change)
        const clampedIndex = Math.max(0, Math.min(index, $$(formattedOptions).length - 1))
        // Calculate target Y using potentially updated layout values
        const targetY = getTargetYForIndex(clampedIndex)

        if (immediate) {
            $$(list).style.transition = 'none'
        } else {
            $$(list).style.transition = 'transform 0.3s ease-out'
        }

        setTranslateY(targetY) // Apply target Y (uses updated bounds)

        const timeoutDuration = immediate ? 10 : 310
        if (snapToIndexTimeout !== 0) { clearTimeout(snapToIndexTimeout); snapToIndexTimeout = 0 }

        // snapToIndexTimeout(
        snapToIndexTimeout = setTimeout(() => {
            if ($$(list).style.transition === 'none') { $$(list).style.transition = 'transform 0.3s ease-out' }
            if ($$(selectedIndex) !== clampedIndex) {
                selectedIndex(clampedIndex)
                // if (onChange && $$(formattedOptions)[$$(selectedIndex)]) {
                //     onChange($$(formattedOptions)[$$(selectedIndex)], $$(selectedIndex))
                // }
            }
            updateItemStyles() // Uses updated viewportHeight
            snapToIndexTimeout = 0
        }, timeoutDuration)
        // )
    }


    function updateItemStyles() {
        // Uses the potentially updated viewportHeight
        const centerViewportY = $$(viewportHeight) / 2
        const listItems = $$(list).querySelectorAll('.picker-item:not(.is-padding)')
        listItems.forEach(item => {
            const itemRect = item.getBoundingClientRect()
            const viewportRect = $$(viewport).getBoundingClientRect()
            const itemCenterRelativeToViewport = (itemRect.top + itemRect.bottom) / 2 - viewportRect.top
            const distanceFromCenter = Math.abs(itemCenterRelativeToViewport - centerViewportY)
            if (distanceFromCenter < $$(itemHeight) * 0.6) { item.classList.add('is-near-center', 'opacity-100', 'font-bold', 'text-[#007bff]', 'scale-100',) }
            else { item.classList.remove('is-near-center', 'opacity-100', 'font-bold', 'text-[#007bff]', 'scale-100',) }
        })
    }

    function getClientY(e: PointerEvent & TouchEvent) { /* ... unchanged ... */
        if (e.type === 'touchend' || e.type === 'touchcancel') { return e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].clientY : startY }
        return e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY
    }
    function handleStart(e: PointerEvent & TouchEvent) { /* ... unchanged ... */
        if ($$(wheelSnapTimeoutId)) {
            clearTimeout($$(wheelSnapTimeoutId))
            wheelSnapTimeoutId(null)
        }
        if (e.type !== 'touchstart') e.preventDefault()
        isDragging = true
        hasMoved = false
        startY = getClientY(e)
        startTranslateY = currentY
        startTime = Date.now()
        lastMoveY = startY
        lastMoveTime = startTime
        velocity = 0
        $$(list).style.transition = 'none'
        $$(viewport).style.cursor = 'grabbing'
        if ($$(rafId)) cancelAnimationFrame($$(rafId))
    }
    function handleMove(e: PointerEvent & TouchEvent) { /* ... unchanged ... */
        if (!isDragging) return
        const currentMoveY = getClientY(e)
        const deltaY = currentMoveY - startY
        if (!hasMoved && Math.abs(deltaY) > CLICK_THRESHOLD_PX) { hasMoved = true }
        if (hasMoved && e.cancelable) { e.preventDefault() }
        let newY = startTranslateY + deltaY
        if (hasMoved) { // Apply rubber band only if moved significantly
            if (newY > maxTranslateY) { newY = maxTranslateY + (newY - maxTranslateY) * 0.3 } else if (newY < minTranslateY) { newY = minTranslateY + (newY - minTranslateY) * 0.3 }
        }
        const now = Date.now()
        const timeDiff = now - lastMoveTime
        if (timeDiff > 10) {
            velocity = (currentMoveY - lastMoveY) / timeDiff
            lastMoveTime = now
            lastMoveY = currentMoveY
        }
        if ($$(rafId)) cancelAnimationFrame($$(rafId))
        rafId(requestAnimationFrame(() => {
            currentY = newY
            $$(list).style.transform = `translateY(${currentY}px)`
            updateItemStyles()
        }))
    }

    function handleEnd(e: PointerEvent) { /* ... unchanged ... */
        if (!isDragging) return
        isDragging = false
        $$(viewport).style.cursor = 'grab'
        if ($$(rafId)) cancelAnimationFrame($$(rafId))
        if (!hasMoved) { // Click/Tap
            const targetElement = e.target as HTMLElement
            const targetItem = targetElement.closest('.picker-item') as HTMLElement
            if (targetItem && !targetItem.classList.contains('is-padding')) {
                const clickedIndex = parseInt(targetItem.dataset.index, 10)
                if (!isNaN(clickedIndex) && clickedIndex >= 0 && clickedIndex < $$(formattedOptions).length) {
                    snapToIndex(clickedIndex)
                    return
                }
            }
            // Optional: if click missed, snap based on current visual position
            const idealIndexMiss = Math.round(($$(indicatorTop) - currentY) / $$(itemHeight)) - $$(paddingItemCount)
            snapToIndex(idealIndexMiss)
            return
        } // Drag/Fling
        if (currentY > maxTranslateY || currentY < minTranslateY) {
            const boundaryIndex = currentY > maxTranslateY ? 0 : $$(formattedOptions).length - 1
            snapToIndex(boundaryIndex)
        }
        else {
            const inertiaDist = velocity * 120
            const predictedY = currentY + inertiaDist
            const idealIndex = Math.round(($$(indicatorTop) - predictedY) / $$(itemHeight)) - $$(paddingItemCount)
            snapToIndex(idealIndex)
        }
        velocity = 0
    }

    function handleWheel(event: WheelEvent) { /* ... unchanged ... */
        if (isDragging) return
        event.preventDefault()
        if ($$(wheelSnapTimeoutId)) { clearTimeout($$(wheelSnapTimeoutId)) } $$(list).style.transition = 'none'

        const scrollAmount = event.deltaY * 0.5
        const newY = currentY - scrollAmount
        setTranslateY(newY)

        // if ($$(selectedIndex) >= formattedOptions.length - 1) return

        wheelSnapTimeoutId(setTimeout(() => {
            const idealIndex = Math.round(($$(indicatorTop) - currentY) / $$(itemHeight)) - $$(paddingItemCount)
            snapToIndex(idealIndex)
            wheelSnapTimeoutId(null)
        }, 150))
    }

    useEffect(() => {
        document.addEventListener('pointermove', handleMove as any)
        document.addEventListener('pointerup', e => handleEnd)

        return () => {
            document.removeEventListener('pointermove', handleMove as any)
            document.removeEventListener('pointerup', handleEnd)
        }
    })

    //update by value
    const oriValue = $()
    useEffect(() => {
        // Find initial index
        if ($$(value) === $$(oriValue)) return

        oriValue($$(value))
        const foundIndex = $$(formattedOptions).findIndex(opt => opt.value === $$(value))

        if ($$(selectedIndex) !== foundIndex) selectedIndex(foundIndex)
    })



    // <<< Populate list *after* first layout calculation >>>
    //populateList()

    // <<< Snap to initial index *after* list is populated and layout is set >>>
    snapToIndex($$(selectedIndex), true)

    const oriIndex = $(-1)

    useEffect(() => {
        if ($$(oriIndex) === $$(selectedIndex))
            return

        oriIndex($$(selectedIndex))

        if ($$(value) !== $$(formattedOptions)[$$(selectedIndex)].value)
            value($$(formattedOptions)[$$(selectedIndex)].value)

        if ($$(selectedIndex) >= 0 && $$(selectedIndex) < $$(formattedOptions).length) { snapToIndex($$(selectedIndex)) }
        else {
            console.warn(`Index "${$$(selectedIndex)}" out of bounds.`)
            selectedIndex(-1)
        }
    })

    // w-[200px] border bg-white shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-2.5 rounded-lg border-solid border-[#ccc]
    return <><div class={['picker-widget', cls,]}>
        {() => $$(header) ? <>
            <div class={'font-bold text-center'}>{header}</div>
            <div class="my-1 h-px w-full bg-gray-300 dark:bg-gray-600"></div></> : null}
        <div ref={viewport}
            onPointerDown={handleStart as any}
            onPointerMove={handleMove as any}     /* {passive: false } */
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            onWheel={handleWheel} /* {passive: false } */
            class={['picker-viewport overflow-hidden relative touch-none cursor-grab overscroll-y-contain transition-[height] duration-[0.3s] ease-[ease-out]']}
            style={{ height: () => `${$$(viewportHeight)}px` }}
        >
            <ul class='picker-list transition-transform duration-[0.3s] ease-[ease-out] m-0 p-0 list-none' ref={list}>
                {() => [...populateList()]}
            </ul>
            <div class='picker-indicator absolute h-9 box-border pointer-events-none bg-[rgba(0,123,255,0.05)] border-y-[#007bff] border-t border-solid border-b inset-x-0' style={{
                height: () => `${$$(itemHeight)}px`,
                top: () => `${$$(indicatorTop) + $$($$(itemHeight)) / 2}px`, // Center line of indicator
                transform: `translateY(-50%)`,
            }}>
            </div>

        </div>
        {/* <div class="self-stretch w-px bg-gray-300 dark:bg-gray-600"></div> */}
        {/* <div class="self-stretch border-l border-gray-300 dark:border-gray-600"></div> */}
        {/* <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div> */}
    </div>

    </>
}
