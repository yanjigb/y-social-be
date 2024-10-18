const dayjs = require('dayjs');

const formatDateTime = (date) => {
    return dayjs(date).format('MMM D, YYYY HH:mm:ss')
}

const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
}

const formatTime = (time) => {
    const ms = time.getTime() - new Date().getTime()

    if (ms <= 0) {
        return '0m 0s 0ms' // Default value for past dates
    }

    const milliseconds = ms % 1000
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)

    return `${minutes}m ${seconds}s ${milliseconds}ms`
}

module.exports = {
    formatDateTime,
    getTomorrow,
    formatTime
}
