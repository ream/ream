import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const formatTime = (time: number) => dayjs(time * 1000).fromNow()
