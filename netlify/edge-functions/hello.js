export default async (request, context) => {
  return new Response('Hello world from the edg function', {
    headers: {
      'content-type': 'text/html',
    },
  })
}
