
import { type JSX, type ObservableMaybe, $$ } from 'woby'

interface FormatInkHighlighterProps extends JSX.SVGAttributes<SVGElement> {
    background?: ObservableMaybe<string>
}

export default (props: FormatInkHighlighterProps) => {
    const { fill, ...rest } = props

    return <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" {...rest}>
        {() => $$(fill) && <rect x="0" y="-960" width="960" height="960" fill={fill} />}
        <path d="M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z" />
    </svg>
}
