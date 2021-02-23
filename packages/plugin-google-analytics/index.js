exports.apply = (api, { trackingId, anonymizeIp }) => {
  if (!trackingId) {
    throw new Error(`missing option "trackingId"`)
  }
  api.defineConstant('import.meta.env.GA_TRACKING_ID', trackingId)
  api.defineConstant('import.meta.env.GA_ANONYMIZE_IP', anonymizeIp)
}

exports.config = {
  name: 'Google Analytics',
}
