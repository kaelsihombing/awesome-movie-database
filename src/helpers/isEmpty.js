const isEmpty = data => {
    return (
        data === undefined ||
        data === null ||
        typeof data === 'object' && Object.keys(data).length === 0 ||
        typeof data === 'string' && data === '' ||
        Array.isArray(data) && data.length === 0
    )
}

module.exports = isEmpty