/** Retired domains send every request to the same path on their target. */
export default {
  fetch(request, env) {
    const { pathname, search } = new URL(request.url)
    return Response.redirect(`${env.TARGET}${pathname}${search}`, 301)
  },
}
