#!/usr/bin/env python3

import sys
import time
import urllib.error
import urllib.request


def fetch_rss(username: str) -> str:
    rss_url = f"https://www.behance.net/feeds/user?username={username}&t={int(time.time() * 1000)}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Cache-Control": "no-cache, no-store",
    }
    request = urllib.request.Request(rss_url, headers=headers)

    with urllib.request.urlopen(request, timeout=12) as response:
        body = response.read().decode("utf-8", "ignore")

    if "<rss" not in body and "<?xml" not in body:
        raise RuntimeError("Behance returned a non-RSS response")

    return body


def main() -> int:
    if len(sys.argv) < 2:
        print("Missing Behance username", file=sys.stderr)
        return 1

    username = sys.argv[1].strip()
    if not username:
        print("Missing Behance username", file=sys.stderr)
        return 1

    try:
        print(fetch_rss(username), end="")
        return 0
    except urllib.error.HTTPError as error:
        print(f"Behance HTTP error: {error.code} {error.reason}", file=sys.stderr)
        if error.code == 429:
            print("Rate limit hit. Please wait 60-120 seconds before trying again.", file=sys.stderr)
    except urllib.error.URLError as error:
        print(f"Behance network error: {error.reason}", file=sys.stderr)
    except TimeoutError:
        print("Behance RSS request timed out after 12s", file=sys.stderr)
    except Exception as error:
        print(str(error), file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
