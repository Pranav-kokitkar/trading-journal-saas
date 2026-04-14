export async function handler(event) {
  const path = event.path.replace("/.netlify/functions/api", "");

  const response = await fetch(`http://139.59.65.78:3000${path}`, {
    method: event.httpMethod,
    headers: {
      "Content-Type": "application/json",
    },
    body: event.body,
  });

  const data = await response.text();

  return {
    statusCode: response.status,
    body: data,
  };
}
