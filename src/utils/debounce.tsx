export const debounce = (callback: (...args: any[]) => any, wait: number = 250) => {
    let timer: NodeJS.Timer // for browser probably should be `number | undefined`
    let last_call = 0
    return (...args: any[]) => {
        clearTimeout(timer)
        const now = Date.now(),
            time_from_last_call = now - last_call

        if (time_from_last_call > wait) {
            last_call = now
            callback(...args)
        } else {
            timer = setTimeout(() => {
                last_call = now
                callback(...args)
            }, wait)
        }
    }
}