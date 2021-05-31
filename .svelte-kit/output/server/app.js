var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
import {create_ssr_component, validate_component, missing_component, escape as escape$1, each, add_attribute} from "svelte/internal";
import {setContext, afterUpdate, onMount} from "svelte";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe};
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
const s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (branch) {
    branch.forEach(({node, loaded, fetched, uses_credentials}) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({node}) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = {head: "", html: "", css: {code: "", map: null}};
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${branch.map(({node}) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		</script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, body: body2, json}) => {
    return body2 ? `<script type="svelte-data" url="${url}" body="${hash(body2)}">${json}</script>` : `<script type="svelte-data" url="${url}">${json}</script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({head, body})
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
const s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const {module} = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await fetch(url, opts);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = {...opts.headers};
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            if (opts.body && typeof opts.body !== "string") {
              throw new Error("Request body must be a string");
            }
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: {...context}
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
const escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({request, options: options2, state, $session, status, error: error2}) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (error3) {
    options2.handle_error(error3);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
async function respond$1({request, options: options2, state, $session, route}) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error3) {
    options2.handle_error(error3);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error2;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({status, error: error2} = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error2 = e;
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error2,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error3) {
    options2.handle_error(error3);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key.toLowerCase()] = obj[key];
  }
  return clone;
}
function error$1(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({...request, params});
    if (response) {
      if (typeof response !== "object") {
        return error$1(`Invalid response from route ${request.path}: expected an object, got ${typeof response}`);
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      if (type === "application/octet-stream" && !(body instanceof Uint8Array)) {
        return error$1(`Invalid response from route ${request.path}: body must be an instance of Uint8Array if content type is application/octet-stream`);
      }
      if (body instanceof Uint8Array && type !== "application/octet-stream") {
        return error$1(`Invalid response from route ${request.path}: Uint8Array body must be accompanied by content-type: application/octet-stream header`);
      }
      let normalized_body;
      if (typeof body === "object" && (!type || type === "application/json")) {
        headers = {...headers, "content-type": "application/json"};
        normalized_body = JSON.stringify(body);
      } else {
        normalized_body = body;
      }
      return {status, body: normalized_body, headers};
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
class ReadOnlyFormData {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
}
_map = new WeakMap();
function parse_body(req) {
  const raw = req.rawBody;
  if (!raw)
    return raw;
  const [type, ...directives] = req.headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const {data, append} = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const {data, append} = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers: lowercase_keys(incoming.headers),
        body: parse_body(incoming),
        params: null,
        locals: {}
      },
      render: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: {ssr: false, router: true, hydrate: true},
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
var root_svelte_svelte_type_style_lang = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$4 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\texport let props_3 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}>\\n\\t\\t\\t\\t\\t{#if components[3]}\\n\\t\\t\\t\\t\\t\\t<svelte:component this={components[3]} {...(props_3 || {})}/>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</svelte:component>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA2DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {stores} = $$props;
  let {page} = $$props;
  let {components} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  let {props_2 = null} = $$props;
  let {props_3 = null} = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  if ($$props.props_3 === void 0 && $$bindings.props_3 && props_3 !== void 0)
    $$bindings.props_3(props_3);
  $$result.css.add(css$4);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {
        default: () => `${components[3] ? `${validate_component(components[3] || missing_component, "svelte:component").$$render($$result, Object.assign(props_3 || {}), {}, {})}` : ``}`
      })}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `${escape$1(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
let options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-49c7732d.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-49c7732d.js", "/./_app/chunks/vendor-289f0ca5.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2) => {
      console.error(error2.stack);
      error2.stack = options.get_stack(error2);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
const empty = () => ({});
const manifest = {
  assets: [],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/example-markdown\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/example-markdown.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/offfff\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/offfff/__layout.svelte", "src/routes/offfff/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/offfff\/s1ep1\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/offfff/__layout.svelte", "src/routes/offfff/s1ep1.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
const get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({request, render: render2}) => render2(request))
});
const module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout$1;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/example-markdown.md": () => Promise.resolve().then(function() {
    return exampleMarkdown;
  }),
  "src/routes/offfff/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  "src/routes/offfff/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/offfff/s1ep1.md": () => Promise.resolve().then(function() {
    return s1ep1;
  })
};
const metadata_lookup = {"src/routes/__layout.svelte": {"entry": "/./_app/pages/__layout.svelte-4dcac2dc.js", "css": ["/./_app/assets/pages/__layout.svelte-80181008.css"], "js": ["/./_app/pages/__layout.svelte-4dcac2dc.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, ".svelte-kit/build/components/error.svelte": {"entry": "/./_app/error.svelte-f67d766c.js", "css": [], "js": ["/./_app/error.svelte-f67d766c.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, "src/routes/index.svelte": {"entry": "/./_app/pages/index.svelte-dfe30eb3.js", "css": ["/./_app/assets/pages/index.svelte-1515a0b5.css"], "js": ["/./_app/pages/index.svelte-dfe30eb3.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, "src/routes/example-markdown.md": {"entry": "/./_app/pages/example-markdown.md-f50aa767.js", "css": [], "js": ["/./_app/pages/example-markdown.md-f50aa767.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, "src/routes/offfff/__layout.svelte": {"entry": "/./_app/pages/offfff/__layout.svelte-86d7a585.js", "css": ["/./_app/assets/pages/offfff/__layout.svelte-e5b61364.css"], "js": ["/./_app/pages/offfff/__layout.svelte-86d7a585.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, "src/routes/offfff/index.svelte": {"entry": "/./_app/pages/offfff/index.svelte-6205435e.js", "css": [], "js": ["/./_app/pages/offfff/index.svelte-6205435e.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}, "src/routes/offfff/s1ep1.md": {"entry": "/./_app/pages/offfff/s1ep1.md-71b1260c.js", "css": [], "js": ["/./_app/pages/offfff/s1ep1.md-71b1260c.js", "/./_app/chunks/vendor-289f0ca5.js"], "styles": null}};
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({paths: {"base": "", "assets": "/."}});
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({...request, host}, options, {prerender});
}
var Navbar_svelte_svelte_type_style_lang = ".navbar.svelte-1q1lrgc.svelte-1q1lrgc{border-bottom:1px solid #666;font-family:'Raleway', sans-serif;font-weight:100;display:flex;justify-content:space-between}.nav-links.svelte-1q1lrgc.svelte-1q1lrgc{display:flex;list-style:none}.nav-links.svelte-1q1lrgc>a.svelte-1q1lrgc{padding:0.5em 1.2em 0.5em 1.2em;color:black;text-decoration:none;font-size:1.4em;align-self:end}.nav-links.svelte-1q1lrgc>a.svelte-1q1lrgc:hover{text-decoration:underline}.brand.svelte-1q1lrgc.svelte-1q1lrgc{font-size:1.4em}.left-paint.svelte-1q1lrgc.svelte-1q1lrgc{height:59px;width:465px;background-image:url('__VITE_ASSET__9972942c__')}.right-paint.svelte-1q1lrgc.svelte-1q1lrgc{height:59px;background-image:url('__VITE_ASSET__9eb045f3__');width:465px}";
const css$3 = {
  code: ".navbar.svelte-1q1lrgc.svelte-1q1lrgc{border-bottom:1px solid #666;font-family:'Raleway', sans-serif;font-weight:100;display:flex;justify-content:space-between}.nav-links.svelte-1q1lrgc.svelte-1q1lrgc{display:flex;list-style:none}.nav-links.svelte-1q1lrgc>a.svelte-1q1lrgc{padding:0.5em 1.2em 0.5em 1.2em;color:black;text-decoration:none;font-size:1.4em;align-self:end}.nav-links.svelte-1q1lrgc>a.svelte-1q1lrgc:hover{text-decoration:underline}.brand.svelte-1q1lrgc.svelte-1q1lrgc{font-size:1.4em}.left-paint.svelte-1q1lrgc.svelte-1q1lrgc{height:59px;width:465px;background-image:url('/src/static/background-splash-left.png')}.right-paint.svelte-1q1lrgc.svelte-1q1lrgc{height:59px;background-image:url('/src/static/background-splash-right.png');width:465px}",
  map: `{"version":3,"file":"Navbar.svelte","sources":["Navbar.svelte"],"sourcesContent":["<script>\\r\\n\\tconst navItems = [{ label: 'Naheulbeuk', href: 'offfff/' }];\\r\\n</script>\\r\\n\\r\\n<style>\\r\\n\\t.navbar {\\r\\n\\t\\tborder-bottom: 1px solid #666;\\r\\n\\t\\tfont-family: 'Raleway', sans-serif;\\r\\n\\t\\tfont-weight: 100;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t}\\r\\n\\r\\n\\t.nav-links {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tlist-style: none;\\r\\n\\t}\\r\\n\\r\\n\\t.nav-links > a {\\r\\n\\t\\tpadding: 0.5em 1.2em 0.5em 1.2em;\\r\\n\\t\\tcolor: black;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tfont-size: 1.4em;\\r\\n\\t\\talign-self: end;\\r\\n\\t}\\r\\n\\r\\n\\t.nav-links > a:hover {\\r\\n\\t\\ttext-decoration: underline;\\r\\n\\t}\\r\\n\\r\\n\\t.brand {\\r\\n\\t\\tfont-size: 1.4em;\\r\\n\\t}\\r\\n\\r\\n\\t.left-paint {\\r\\n\\t\\theight: 59px;\\r\\n\\t\\twidth: 465px;\\r\\n\\t\\tbackground-image: url('/src/static/background-splash-left.png');\\r\\n\\t}\\r\\n\\r\\n\\t.right-paint {\\r\\n\\t\\theight: 59px;\\r\\n\\t\\tbackground-image: url('/src/static/background-splash-right.png');\\r\\n\\t\\twidth: 465px;\\r\\n\\t}\\r\\n</style>\\r\\n\\r\\n<nav class=\\"navbar\\">\\r\\n\\t<div class=\\"left-paint\\" />\\r\\n\\t<ul class=\\"nav-links\\">\\r\\n\\t\\t<a href=\\"/\\">\\r\\n\\t\\t\\t<li class=\\"brand\\">Daydreel</li>\\r\\n\\t\\t</a>\\r\\n\\t\\t{#each navItems as item}\\r\\n\\t\\t\\t<a href={item.href}>\\r\\n\\t\\t\\t\\t<li>{item.label}</li>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t{/each}\\r\\n\\t</ul>\\r\\n\\t<div class=\\"right-paint\\" />\\r\\n</nav>\\r\\n"],"names":[],"mappings":"AAKC,OAAO,8BAAC,CAAC,AACR,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,CAC7B,WAAW,CAAE,SAAS,CAAC,CAAC,UAAU,CAClC,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,AAC/B,CAAC,AAED,UAAU,8BAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,AACjB,CAAC,AAED,yBAAU,CAAG,CAAC,eAAC,CAAC,AACf,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,KAAK,CAChC,KAAK,CAAE,KAAK,CACZ,eAAe,CAAE,IAAI,CACrB,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,GAAG,AAChB,CAAC,AAED,yBAAU,CAAG,gBAAC,MAAM,AAAC,CAAC,AACrB,eAAe,CAAE,SAAS,AAC3B,CAAC,AAED,MAAM,8BAAC,CAAC,AACP,SAAS,CAAE,KAAK,AACjB,CAAC,AAED,WAAW,8BAAC,CAAC,AACZ,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,KAAK,CACZ,gBAAgB,CAAE,IAAI,wCAAwC,CAAC,AAChE,CAAC,AAED,YAAY,8BAAC,CAAC,AACb,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,IAAI,yCAAyC,CAAC,CAChE,KAAK,CAAE,KAAK,AACb,CAAC"}`
};
const Navbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const navItems = [{label: "Naheulbeuk", href: "offfff/"}];
  $$result.css.add(css$3);
  return `<nav class="${"navbar svelte-1q1lrgc"}"><div class="${"left-paint svelte-1q1lrgc"}"></div>
	<ul class="${"nav-links svelte-1q1lrgc"}"><a href="${"/"}" class="${"svelte-1q1lrgc"}"><li class="${"brand svelte-1q1lrgc"}">Daydreel</li></a>
		${each(navItems, (item) => `<a${add_attribute("href", item.href, 0)} class="${"svelte-1q1lrgc"}"><li>${escape$1(item.label)}</li>
			</a>`)}</ul>
	<div class="${"right-paint svelte-1q1lrgc"}"></div></nav>`;
});
var global = "* {\r\n	margin: 0;\r\n	padding: 0;\r\n}\r\n\r\nhtml{\r\n	height: 100%;\r\n}\r\n\r\nbody{\r\n	height: 100%;\r\n}\r\n\r\n.body{\r\n	height: 100%;\r\n}\r\n\r\n#svelte{\r\n	height: 100%;\r\n}\r\n\r\n.content{\r\n	display: grid;\r\n	grid-template-columns: 1fr 3fr 1fr;\r\n	height: 100%;\r\n	background-color: #fbfbfb;\r\n	color: #4a362f;\r\n}\r\n\r\nh1,h2 {\r\n	margin: 1em;\r\n}\r\n\r\nh2 > a {\r\n	text-decoration: none;\r\n	color: #111;\r\n}\r\n\r\np {\r\n	margin-bottom: 1.4em;\r\n}";
const _layout$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<link rel="${"preconnect"}" href="${"https://fonts.gstatic.com"}">
<link href="${"https://fonts.googleapis.com/css2?family=Raleway:wght@100;300&display=swap"}" rel="${"stylesheet"}">

<link rel="${"preconnect"}" href="${"https://fonts.gstatic.com"}">
<link href="${"https://fonts.googleapis.com/css2?family=PT+Serif&display=swap"}" rel="${"stylesheet"}">

${validate_component(Navbar, "Navbar").$$render($$result, {}, {}, {})}
<div class="${"body"}"><div class="${"content"}">${slots.default ? slots.default({}) : ``}</div></div>`;
});
var __layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout$1
});
function load({error: error2, status}) {
  return {props: {error: error2, status}};
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape$1(status)}</h1>

<p>${escape$1(error2.message)}</p>


${error2.stack ? `<pre>${escape$1(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var index_svelte_svelte_type_style_lang = ".home-page.svelte-1rtamjf{grid-column-start:2;grid-column-end:2;text-align:justify;line-height:1.4em;font-size:18px;font-family:'PT Serif', serif}";
const css$2 = {
  code: ".home-page.svelte-1rtamjf{grid-column-start:2;grid-column-end:2;text-align:justify;line-height:1.4em;font-size:18px;font-family:'PT Serif', serif}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<style>\\n\\t.home-page {\\n\\t\\tgrid-column-start: 2;\\n\\t\\tgrid-column-end: 2;\\n\\t\\ttext-align: justify;\\n\\t\\tline-height: 1.4em;\\n\\t\\tfont-size: 18px;\\n\\t\\tfont-family: 'PT Serif', serif;\\n\\t}\\n</style>\\n\\n<div class=\\"home-page\\">\\n\\t<h1>Coucou, tu veux voir mon site ?</h1>\\n\\t<p>Je construis un peu cet espace virtuel pour pr\xE9senter mes multiples cr\xE9ations</p>\\n\\t<p>\\n\\t\\tPremi\xE8re cr\xE9ation mis en avant, les\\n\\t\\t<a href=\\"/offfff\\">aventuriers de la compagnie Offfff.</a>\\n\\t</p>\\n\\t<p>\\n\\t\\tSur le long terme, il y aura plus de contenus comme un blog, des jeux, d'autres s\xE9ries ou\\n\\t\\t\xE9crits.\\n\\t</p>\\n</div>\\n"],"names":[],"mappings":"AACC,UAAU,eAAC,CAAC,AACX,iBAAiB,CAAE,CAAC,CACpB,eAAe,CAAE,CAAC,CAClB,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,KAAK,CAClB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,UAAU,CAAC,CAAC,KAAK,AAC/B,CAAC"}`
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `<div class="${"home-page svelte-1rtamjf"}"><h1>Coucou, tu veux voir mon site ?</h1>
	<p>Je construis un peu cet espace virtuel pour pr\xE9senter mes multiples cr\xE9ations</p>
	<p>Premi\xE8re cr\xE9ation mis en avant, les
		<a href="${"/offfff"}">aventuriers de la compagnie Offfff.</a></p>
	<p>Sur le long terme, il y aura plus de contenus comme un blog, des jeux, d&#39;autres s\xE9ries ou
		\xE9crits.
	</p></div>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
const Example_markdown = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<p><strong>Note that despite this file having an md extension, it can support all Svelte language features (like scripting). Do not import untrusted or user-created markdown files.</strong></p>
<p><em>This markdown sample was taken from <a href="${"https://gist.github.com/rt2zz/e0a1d6ab2682d2c47746950b84c0b6ee"}" rel="${"nofollow"}">here</a>.</em></p>
<h1 id="${"an-h1-header"}"><a href="${"#an-h1-header"}">An h1 header</a></h1>
<p>Paragraphs are separated by a blank line.</p>
<p>2nd paragraph. <em>Italic</em>, <strong>bold</strong>, and <code>monospace</code>. Itemized lists
look like:</p>
<ul><li>this one</li>
<li>that one</li>
<li>the other one</li></ul>
<p>Note that \u2014 not considering the asterisk \u2014 the actual text
content starts at 4-columns in.</p>
<blockquote><p>Block quotes are
written like so.</p>
<p>They can span multiple paragraphs,
if you like.</p></blockquote>
<p>Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., \u201Cit\u2019s all
in chapters 12\u201314\u201D). Three dots \u2026 will be converted to an ellipsis.
Unicode is supported. \u263A</p>
<h2 id="${"an-h2-header"}"><a href="${"#an-h2-header"}">An h2 header</a></h2>
<p>Here\u2019s a numbered list:</p>
<ol><li>first item</li>
<li>second item</li>
<li>third item</li></ol>
<p>By the way, you can write code in delimited blocks:</p>
<pre class="${"language-undefined"}">${`<code class="language-undefined">define foobar() &#123;
    print &quot;Welcome to flavor country!&quot;;
&#125;</code>`}</pre>
<p>(which makes copying &amp; pasting easier). You can optionally mark the
delimited block for syntax highlighting when you include the CSS for a Prism theme:</p>
<pre class="${"language-python"}">${`<code class="language-python"><span class="token keyword">import</span> time
<span class="token comment"># Quick, count to ten!</span>
<span class="token keyword">for</span> i <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token comment"># (but not *too* quick)</span>
    time<span class="token punctuation">.</span>sleep<span class="token punctuation">(</span><span class="token number">0.5</span><span class="token punctuation">)</span>
    <span class="token keyword">print</span> i</code>`}</pre>
<h3 id="${"an-h3-header"}"><a href="${"#an-h3-header"}">An h3 header</a></h3>
<p>Now, a nested list:</p>
<ol><li>First, get these ingredients:<ul><li>carrots</li>
<li>celery</li>
<li>lentils</li></ul></li>
<li>Boil some water.</li>
<li>Dump everything in the pot and follow
this algorithm:<pre class="${"language-undefined"}">${`<code class="language-undefined">find wooden spoon
uncover pot
stir
cover pot
balance wooden spoon precariously on pot handle
wait 10 minutes
goto first step (or shut off burner when done)</code>`}</pre>Do not bump wooden spoon or it will fall.</li></ol>
<p>Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).</p>
<p>Here\u2019s a link to <a href="${"http://foo.bar"}" rel="${"nofollow"}">a website</a> and one to this site\u2019s <a href="${"/"}">home page</a>. Because the <code>rehype-slug</code> and <code>rehype-autolink-headings</code> plugins have been set up for you, <a href="${"#an-h2-header"}">this will link to a section heading in the current
doc</a>.</p>
<p>A horizontal rule follows.</p>
<hr>
<p>And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, *bar*, etc.</p>
<p>This mention \u2014 <a href="${"https://github.com/svelte-add"}"><strong>@svelte-add</strong></a> \u2014 will turn into a link to the <code>svelte-add</code> GitHub page because the <code>remark-github</code> plugin is setup.</p>`;
});
var exampleMarkdown = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Example_markdown
});
var Sidebar_svelte_svelte_type_style_lang = ".sidebar.svelte-1yi6otb{font-size:1.3em;padding:1em 0em 0em 1em;margin:0em 1em 0em 0em;border-right-style:solid;border-width:2px;border-color:#333;background-color:white;list-style:none}li.svelte-1yi6otb{list-style:none}.side-links.svelte-1yi6otb{padding:0.5em 1.2em 0.5em 1.2em;color:black;text-decoration:none;font-size:1em;align-self:end;font-family:'Raleway', sans-serif;line-height:1.6em}.side-links.svelte-1yi6otb:hover{text-decoration:underline}";
const css$1 = {
  code: ".sidebar.svelte-1yi6otb{font-size:1.3em;padding:1em 0em 0em 1em;margin:0em 1em 0em 0em;border-right-style:solid;border-width:2px;border-color:#333;background-color:white;list-style:none}li.svelte-1yi6otb{list-style:none}.side-links.svelte-1yi6otb{padding:0.5em 1.2em 0.5em 1.2em;color:black;text-decoration:none;font-size:1em;align-self:end;font-family:'Raleway', sans-serif;line-height:1.6em}.side-links.svelte-1yi6otb:hover{text-decoration:underline}",
  map: `{"version":3,"file":"Sidebar.svelte","sources":["Sidebar.svelte"],"sourcesContent":["<script>\\r\\n\\tconst navItems = [\\r\\n\\t\\t{ label: 'Pr\xE9face', href: '/offfff' },\\r\\n\\t\\t{ label: 'Episode 1', href: '/offfff/s1ep1' }\\r\\n\\t];\\r\\n</script>\\r\\n\\r\\n<style>\\r\\n\\t.sidebar {\\r\\n\\t\\tfont-size: 1.3em;\\r\\n\\t\\tpadding: 1em 0em 0em 1em;\\r\\n\\t\\tmargin: 0em 1em 0em 0em;\\r\\n\\t\\tborder-right-style: solid;\\r\\n\\t\\tborder-width: 2px;\\r\\n\\t\\tborder-color: #333;\\r\\n\\t\\tbackground-color: white;\\r\\n\\t\\tlist-style: none;\\r\\n\\t}\\r\\n\\tli {\\r\\n\\t\\tlist-style: none;\\r\\n\\t}\\r\\n\\r\\n\\t.side-links {\\r\\n\\t\\tpadding: 0.5em 1.2em 0.5em 1.2em;\\r\\n\\t\\tcolor: black;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tfont-size: 1em;\\r\\n\\t\\talign-self: end;\\r\\n\\t\\tfont-family: 'Raleway', sans-serif;\\r\\n\\t\\tline-height: 1.6em;\\r\\n\\t}\\r\\n\\r\\n\\t.side-links:hover {\\r\\n\\t\\ttext-decoration: underline;\\r\\n\\t}\\r\\n</style>\\r\\n\\r\\n<nav class=\\"sidebar\\">\\r\\n\\t<ul>\\r\\n\\t\\t{#each navItems as item}\\r\\n\\t\\t\\t<li>\\r\\n\\t\\t\\t\\t<a class=\\"side-links\\" href={item.href}>{item.label}</a>\\r\\n\\t\\t\\t</li>\\r\\n\\t\\t{/each}\\r\\n\\t</ul>\\r\\n</nav>\\r\\n"],"names":[],"mappings":"AAQC,QAAQ,eAAC,CAAC,AACT,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CACxB,MAAM,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CACvB,kBAAkB,CAAE,KAAK,CACzB,YAAY,CAAE,GAAG,CACjB,YAAY,CAAE,IAAI,CAClB,gBAAgB,CAAE,KAAK,CACvB,UAAU,CAAE,IAAI,AACjB,CAAC,AACD,EAAE,eAAC,CAAC,AACH,UAAU,CAAE,IAAI,AACjB,CAAC,AAED,WAAW,eAAC,CAAC,AACZ,OAAO,CAAE,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,KAAK,CAChC,KAAK,CAAE,KAAK,CACZ,eAAe,CAAE,IAAI,CACrB,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,GAAG,CACf,WAAW,CAAE,SAAS,CAAC,CAAC,UAAU,CAClC,WAAW,CAAE,KAAK,AACnB,CAAC,AAED,0BAAW,MAAM,AAAC,CAAC,AAClB,eAAe,CAAE,SAAS,AAC3B,CAAC"}`
};
const Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const navItems = [
    {label: "Pr\xE9face", href: "/offfff"},
    {
      label: "Episode 1",
      href: "/offfff/s1ep1"
    }
  ];
  $$result.css.add(css$1);
  return `<nav class="${"sidebar svelte-1yi6otb"}"><ul>${each(navItems, (item) => `<li class="${"svelte-1yi6otb"}"><a class="${"side-links svelte-1yi6otb"}"${add_attribute("href", item.href, 0)}>${escape$1(item.label)}</a>
			</li>`)}</ul></nav>`;
});
var __layout_svelte_svelte_type_style_lang = ".story.svelte-i1jts7{grid-column-start:2;grid-column-end:2;text-align:justify;line-height:1.4em;font-size:18px;font-family:'PT Serif', serif}";
const css = {
  code: ".story.svelte-i1jts7{grid-column-start:2;grid-column-end:2;text-align:justify;line-height:1.4em;font-size:18px;font-family:'PT Serif', serif}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\r\\n\\timport Sidebar from '$lib/Sidebar.svelte';\\r\\n</script>\\r\\n\\r\\n<style>\\r\\n\\t.story {\\r\\n\\t\\tgrid-column-start: 2;\\r\\n\\t\\tgrid-column-end: 2;\\r\\n\\t\\ttext-align: justify;\\r\\n\\t\\tline-height: 1.4em;\\r\\n\\t\\tfont-size: 18px;\\r\\n\\t\\tfont-family: 'PT Serif', serif;\\r\\n\\t}\\r\\n</style>\\r\\n\\r\\n<Sidebar />\\r\\n<div class=\\"story\\">\\r\\n\\t<slot />\\r\\n</div>\\r\\n"],"names":[],"mappings":"AAKC,MAAM,cAAC,CAAC,AACP,iBAAiB,CAAE,CAAC,CACpB,eAAe,CAAE,CAAC,CAClB,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,KAAK,CAClB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,UAAU,CAAC,CAAC,KAAK,AAC/B,CAAC"}`
};
const _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${validate_component(Sidebar, "Sidebar").$$render($$result, {}, {}, {})}
<div class="${"story svelte-i1jts7"}">${slots.default ? slots.default({}) : ``}</div>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
const Offfff = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>Oarf, une pr\xE9face ...</h1>

<p>Un jour j&#39;\xE9crirai un truc cool ici. Cependant, en quelques mots, ceci est l&#39;aventure de la
	compagnie Offfff, romanc\xE9 \xE0 partir de fait construit autour d&#39;un JDR. Le jeu de r\xF4le de Naheulbeuk
	!
</p>
<p>Actuellement, je sortirai un \xE9pisode tous les premiers week-end du mois.</p>
<p>Enjoy !</p>
<p>Daydreel</p>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Offfff
});
const S1ep1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h2 id="${"episode-1---nos-h\xE9ros-m\xE9connus"}"><a href="${"#episode-1---nos-h\xE9ros-m\xE9connus"}">Episode 1 - Nos h\xE9ros m\xE9connus</a></h2>
<p>\u2013 \u2018Xcusez-moi m\u2019sieur ! Vous savez o\xF9 se trouve la taverne Tirlipoinpont ?</p>
<p>\u2013 Euuuh, bonjour, oui, je crois \u2026 Essayez la rue des Bi\xE8res pas loin du stade, vous avez juste \xE0 remonter l\u2019avenue des Grandes Beignes</p>
<p>\u2013 Merci m\u2019sieur ! lan\xE7a un jeune homme aux cheveux blonds comme la paille et au visage ravag\xE9 comme la terre fra\xEEchement labour\xE9e.</p>
<p>Le passant reprit son chemin tandis qu\u2019Aymeric Pailledor s\u2019\xE9clipsa pour retrouver sa coll\xE8gue</p>
<p>\u2013 Alors ?</p>
<p>\u2013 6 pi\xE8ces d\u2019or et autant d\u2019argent, faut vraiment que tu choisisses mieux tes clients, r\xE9pondit s\xE8chement une femme encapuchonn\xE9e. </p>
<p>Sa peau avait la couleur de la lune et la texture de la soie mais son regard sombre et fuyant trahissait sa nervosit\xE9 des foules. Shy \xE9tait \xE9quip\xE9e d\u2019une tenue ab\xEEm\xE9e, m\xE9langeant le cuir et le tissu, qui facilitait le mouvement et la discr\xE9tion dans les all\xE9es sombres. Sa cape verte fonc\xE9 et us\xE9e n\u2019avait d\u2019utilit\xE9 que de la prot\xE9ger de la pluie et des regards. Son dernier recours : une dague \xE0 la ceinture.</p>
<p>En revanche n\u2019importe qui pouvait la confondre pour une chasseuse d\xFB \xE0 l\u2019arc et au carquois qu\u2019elle portait constamment avec elle. Pourtant Aymeric et elle partageaient la m\xEAme profession des rues. Ce dernier \xE9tait simplement habill\xE9 en tenue de ville, pantalon et chemise en lin ainsi qu\u2019un poignard \xE0 la ceinture.</p>
<p>\u2013 Bah c\u2019est bon, on a de quoi manger et boire ce soir !</p>
<p>\u2013 Ouais, et ta pote doit nous attendre aux Glavioteurs, d\xE9clara Shy en partant \xE0 l\u2019oppos\xE9 du stade.</p>
<p>\u2013 Ah ouais, j\u2019t\u2019ai pas dit, mais l\u2019truc qu\u2019Herm\u2019line veut nous dire ce soir est m\xE9g\u2019important. Elle a peut-\xEAtre enfin trouv\xE9 une mission.</p>
<p>\u2013 Cool parce que j\u2019en peux plus des b\xE2tards Kek qui boivent comme des trous sur notre dos ! C\u2019est quoi comme mission ?</p>
<p>\u2013 J\u2019chais pas, on a pas eu le temps d\u2019parler hier, c\u2019tait sa derni\xE8re journ\xE9e d\u2019apprentie paladine.</p>
<p>\u2013 Okay, si on pouvait se barrer de cette ville de merde au plus vite \xE7a m\u2019arrangerait sinon je vais finir par tuer un Kek.</p>
<p>\u2013 Tu tuerais l\u2019quel ?</p>
<p>\u2013 Kevin\u2026, souffla Shy sans h\xE9sitation.</p>
<p>\u201CAu Glavioteur Sonore\u201D criait l\u2019enseigne, verte et jaune d\u2019un elfe rotant, au-dessus de la destination du duo. </p>
<p>Des elfes, humains et des mages se retrouvaient, apr\xE8s une p\xE9nible journ\xE9e de travail, pour se d\xE9tendre \xE0 cette taverne fleurie. Que ce soit autour de bi\xE8re ou de jus de myrtille, l\u2019ambiance \xE9tait toujours au rendez-vous des happy hours du Glavioteur Sonore.</p>
<p>Sortant du lot des badauds raffin\xE9s, \xE9tait pos\xE9e contre la fa\xE7ade de la taverne Hermeline, une bi\xE8re \xE0 la main. </p>
<p>Impossible de la rater avec ses 1m80, paladin du dieu sang \xE0 en devenir, elle poss\xE9dait une carrure \xE0 la hauteur de la violence d\u2019une telle formation. Sa posture calme respirait la force, ses cheveux flamboyants illuminaient son visage attrayant. Mais de ses yeux se lisait une courageuse f\xE9rocit\xE9 \xE0 d\xE9fier le monde entier !</p>
<p>Son charisme allait de paire avec l\u2019uniforme intimidant des aspirants paladins, comprenant un plastron de cuir marqu\xE9 du sceau de Khornettoh et d\u2019une \xE9p\xE9e \xE0 une main.</p>
<p>\u2013 H\xE9, Herm\u2019line, \xE7a va ? interpella Aymeric sans la moindre conscience de danger. </p>
<p>Shy, d\xE9testant la foule, resta en retrait de la taverne, observant Aymeric et Hermeline converser. </p>
<p>\u201CJe vais peut-\xEAtre pouvoir piquer un petit bonus ce soir\u201D, pensa Shy, \u201Cpendant qu\u2019Aymeric discute des d\xE9tails de la mission. Pourtant, il n\u2019est tr\xE8s clairement pas taill\xE9 pour l\u2019aventure mais j\u2019imagine qu\u2019il ne peut pas quitter sa meilleure amie Hermeline. Faut dire, avec un monstre pareil, personne n\u2019irait le faire chier. Je ne comprends toujours pas comment cet idiot a fini par travailler pour les Kek apr\xE8s avoir quitter leur village natal. O\xF9 peut-\xEAtre que c\u2019est juste \xE7a : un idiot \u2026 mais\u2026 un idiot attachant\u2026\u201D</p>
<p>Notre groupe d\u2019aventurier, un peu plus loin de la foule ambiante de la taverne.</p>
<p>\u2013 Notre commanditaire est le doyen de l\u2019universit\xE9 de magie A\xE9rogastre Fladubide, commen\xE7a \xE0 expliquer Hermeline au groupe. Il a perdu les clefs de sa tour et donne rendez-vous aux aventuriers vers 6h de l\u2019apr\xE8m, devant sa porte, pour expliquer le reste.</p>
<p>\u2013 On est pay\xE9 combien ? demanda professionnellement Shy.</p>
<p>\u2013 C\u2019est \xE7a le plus beau ! 1000 pi\xE8ces d\u2019or juste pour un trousseau de clef.</p>
<p>\u2013 Ouais, mais c\u2019est s\xFBrement le trousseau de l\u2019universit\xE9 aussi, commenta Aymeric sans que personne ne pr\xEAte attention \xE0 lui.</p>
<p>\u2013 C\u2019est quoi le pi\xE8ge ? redemanda Shy, suspicieuse.</p>
<p>\u2013 Y\u2019en a pas, \xE0 priori \u2026</p>
<p>Hermeline remonta la rue en marchant sans attendre qui que ce soit.</p>
<p>\u2013 Le rendez-vous est dans une vingtaine de minute, vous venez ?</p>`;
});
var s1ep1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": S1ep1
});
export {init, render};
