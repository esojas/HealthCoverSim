// Small fetch wrappers. Any failure throws an Error with an `errors` array of messages.
async function request(path, options) {
    let res;
    try {
      res = await fetch(`/api/quotes${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
    } catch {
      const err = new Error("Cannot reach the server. Is the backend running on port 3001?");
      err.errors = [err.message];
      throw err;
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data.errors && data.errors[0]) || "Request failed.");
      err.errors = data.errors || [err.message];
      throw err;
    }
    return data;
  }
  
  export const listQuotes = () => request("");
  export const getQuote = (id) => request(`/${id}`);
  export const createQuote = (body) => request("", { method: "POST", body: JSON.stringify(body) });
  export const updateQuote = (id, body) => request(`/${id}`, { method: "PUT", body: JSON.stringify(body) });
  export const deleteQuote = (id) => request(`/${id}`, { method: "DELETE" });