"use strict";

const data = window.instagramData;
const metrics = {
  views: "Views", likes: "Likes", shares: "Shares", follows: "Follows",
  profile_visits: "Profile visits", reach: "Reach", link_clicks: "Link clicks"
};
const outcomes = {
  views: "earned views", likes: "earned likes", shares: "were shared",
  follows: "brought followers", profile_visits: "drove profile visits"
};
const prLineup = [
  ["Ahmad Ali (Head of PR)", "3xa.png"],
  ["Christine Nguyen (Historian)", "chriistinenguyen"],
  ["Leah Ye (Historian)", "l.eayeee"],
  ["Mysha Mosharaf (Marketing)", "mvshaaaa"],
  ["Rohan Chhahira (Webmaster)", "thebigbluebox1"]
];
const milestones = [
  ["2026-08-20", "Head of PR term begins", null, "Semester starts! We began our work in PR for the fall with new members and new Exec. Below is our PR Lineup!"],
  ["2026-08-21", "First post under new PR lead", /You heard it here first/, "Our semester kicked off with an info flyer on where we'd be at during fall activities fair and engineering expo. Doing this allowed SASE to start the semester with some visibility!"],
  ["2026-09-06", "Bonfire Night Collab", /Attention 1st years/, "Bonfire Night was our most-viewed post of the semester, with 14,536 views. CCE published the post, and teaming up with ESC, TheConnect, SHPE, NSBE, oSTEM, and SWE likely helped it reach more people. That’s a good reason to keep planning events together."],
  ["2026-09-12", "STEMConnect prep profile visits", /thanks to everyone who attended our conference prep/i, "Our STEMConnect conference prep info story brought in 18 profile visits, the most of any story this semester! People interested in the conference may have clicked through to see what else SASE had going on."],
  ["2026-10-01", "Most Viewed Story", /^i know that’s right$/i, "Vy and Victoria held up our SASE Inspire Award for Best New Chapter at STEMConnect, and 1,064 views made it our most-viewed story. It was a big moment for the chapter and a chance for people to see what our club had accomplished."],
  ["2026-10-08", "October GBM Promotional Reel", /GBM HAPPENING TN/, "We posted this reel the SAME DAY as the October GBM, and it still led every post, reel, and story with 163 likes and 124 shares. The trending format and Ahmad looking absolutely terrified might have helped."],
  ["2026-10-09", "Asian Americans in STEM Promotional Reel", /FIRST ASIAN AMERICANS IN STEM EVENT/, "This reel previewed our October 13 event and brought in SIX followers, the most of any item this semester. The comedy and surprise might have given viewers a reason to stick around."],
  ["2026-11-03", "Executive Board Reveal", /EXEC REVEAL 01/, "We kicked off our four-part exec reveal series by introducing our SASE leaders! At 7,988 views, this opener got the most views of any reveal in the series."],
  ["2026-11-16", "Thanksgiving Fest Post!", /Let’s give thanks/, "Another big collab and a successful Thanksgiving Fest! The teaser drew 9,366 views, the most of any post published by @saseatuva this semester. It gave us another reason to team up with other organizations for future events."]
].map(([date, title, pattern, context]) => ({
  date, title, context,
  item: pattern && data.find(item => item.date === date && pattern.test(item.caption?.trim() || ""))
}));

const element = id => document.getElementById(id);
const metricSelect = element("metric");
const format = value => value == null ? "—" : value.toLocaleString("en-US");
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const dateText = date => dayLabel.format(new Date(date));
const weekStarts = Array.from({ length: 14 }, (_, index) =>
  new Date(Date.UTC(2026, 7, 20 + 7 * index)).toISOString().slice(0, 10));
const weekOf = date => weekStarts.findLastIndex(start => start <= date);
let scope = "all";
let chosenWeek = null;
let eventIndex = 0;
let resultLimit = 12;

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function caption(item) {
  return item.caption?.trim().split(/\r?\n/)[0] || "Untitled " + item.type;
}

function postLink(item, title) {
  let safeUrl;
  try {
    const url = new URL(item.url);
    if (url.protocol === "https:" && ["instagram.com", "www.instagram.com"].includes(url.hostname)) safeUrl = url.href;
  } catch {}
  if (!safeUrl) return node("span", title);
  const link = node("a", title);
  link.href = safeUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function scopedData() {
  return data.filter(item => scope === "all" || (scope === "story") === (item.type === "story"));
}

function summarize(items, metric) {
  const reported = items.filter(item => item[metric] != null);
  return {
    total: reported.length ? reported.reduce((total, item) => total + item[metric], 0) : null,
    count: reported.length
  };
}

function renderStats(items) {
  const stats = Object.entries(metrics).slice(0, 5).map(([key, label]) => {
    const stat = node("div", null, "stat");
    const { total, count } = summarize(items, key);
    const withResult = items.filter(item => item[key] > 0).length;
    const contentType = { all: "posts and stories", feed: "posts", story: "stories" }[scope];
    const coverage = count
      ? "Of " + format(items.length) + " " + contentType + ", " + format(withResult) + " " + outcomes[key]
      : "Unavailable in this export";
    stat.append(node("dt", label), node("dd", format(total), "value"), node("dd", coverage, "coverage"));
    return stat;
  });
  element("stats").replaceChildren(...stats);
}

function renderChart(items, focusWeek = false) {
  const metric = metricSelect.value;
  const weeks = weekStarts.map((_, index) => {
    const members = items.filter(item => weekOf(item.date) === index);
    return { members, ...summarize(members, metric) };
  });
  const peak = Math.max(0, ...weeks.map(week => week.total ?? 0));
  const magnitude = 10 ** Math.floor(Math.log10(peak || 1));
  const max = Math.max(2, Math.ceil(peak / (2 * magnitude)) * 2 * magnitude);
  const best = weeks.findIndex(week => week.total === peak);
  const active = chosenWeek ?? Math.max(0, best);
  const plot = node("div", null, "plot");
  const ticks = node("div", null, "ticks");
  ticks.setAttribute("aria-hidden", "true");
  ticks.append(...[max, max / 2, 0].map(value => node("span", format(value))));
  const plotMain = node("div", null, "plot-main");
  const bars = node("div", null, "bars");
  weeks.forEach((week, index) => {
    const bar = node("button", null, "bar");
    const height = node("span");
    height.style.height = (week.total ?? 0) / max * 100 + "%";
    const value = week.total == null ? (week.members.length ? "no reported value" : "no published items") : format(week.total);
    bar.type = "button";
    bar.title = "Week of " + dateText(weekStarts[index]) + " · " + metrics[metric] + " · " + value;
    bar.setAttribute("aria-label", bar.title);
    bar.setAttribute("aria-pressed", String(index === active));
    bar.append(height);
    bar.addEventListener("click", () => selectWeek(index, true));
    bars.append(bar);
  });
  const labels = node("div", null, "xlabels");
  labels.append(...[0, 3, 6, 9, 13].map(index => node("span", dateText(weekStarts[index]))));
  plotMain.append(bars, labels);
  plot.append(ticks, plotMain);
  element("chart").replaceChildren(plot);
  if (focusWeek) bars.children[active].focus({ preventScroll: true });
  element("chart-note").textContent = "Select a bar to filter the content explorer. A short baseline mark can indicate zero or missing data.";

  const week = weeks[active];
  const detail = element("week");
  detail.replaceChildren(node("h3", "Week of " + dateText(weekStarts[active])));
  detail.append(node("p", format(week.total) + " " + metrics[metric].toLowerCase() + " · " + week.count + " of " + week.members.length + " items reported"));
  const ranked = week.members.filter(item => item[metric] != null).sort((a, b) => b[metric] - a[metric]).slice(0, 3);
  if (ranked.length) {
    detail.append(node("strong", "Leading content"));
    const list = node("ul");
    ranked.forEach(item => {
      const row = node("li");
      const title = caption(item);
      row.append(postLink(item, title.length > 65 ? title.slice(0, 65) + "…" : title), document.createTextNode(" · " + format(item[metric])));
      list.append(row);
    });
    detail.append(list);
  } else {
    detail.append(node("p", "No items in this week have a reported value for this metric."));
  }
}

function renderEvent() {
  [...element("events").children].forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === eventIndex));
  });
  const { date, title, context, item } = milestones[eventIndex];
  const detail = element("event");
  detail.replaceChildren(node("h3", title), node("p", dateText(date) + ", 2026", "event-date"));
  if (item) {
    const highlights = Object.keys(metrics).slice(0, 5)
      .filter(key => item[key] != null)
      .map(key => format(item[key]) + " " + metrics[key].toLowerCase());
    detail.append(node("p", highlights.join(" · ")));
  }
  detail.append(node("p", context, "context"));
  if (date === "2026-08-20") {
    const lineup = node("ul", null, "pr-lineup");
    prLineup.forEach(([name, handle]) => {
      const row = node("li", name + " - ");
      row.append(postLink({ url: "https://www.instagram.com/" + handle + "/" }, "@" + handle));
      lineup.append(row);
    });
    detail.append(lineup, node("p", "This marks the beginning of our semesterly data report!"));
  }
  const actions = node("p");
  if (item) actions.append(postLink(item, item.type === "story" ? "Open original story" : "Open original post"), document.createTextNode(" · "));
  const explore = node("a", "Explore this publish week");
  explore.href = "#library";
  explore.addEventListener("click", () => {
    element("search").value = "";
    setScope("all", weekOf(date));
  });
  actions.append(explore);
  detail.append(actions);
}

function renderLibrary(items) {
  const metric = element("sort").value;
  const search = element("search").value.trim().toLowerCase();
  const filtered = items.filter(item =>
    (chosenWeek == null || weekOf(item.date) === chosenWeek) &&
    [item.caption, item.account, item.type].join(" ").toLowerCase().includes(search)
  ).sort((a, b) => metric === "date"
    ? b.date.localeCompare(a.date)
    : (b[metric] ?? -1) - (a[metric] ?? -1) || b.date.localeCompare(a.date));
  const rows = filtered.slice(0, resultLimit).map(item => {
    const row = node("tr");
    const content = node("td");
    const title = caption(item);
    const link = postLink(item, title.length > 105 ? title.slice(0, 105) + "…" : title);
    link.title = title;
    const meta = node("small", item.type + " · ");
    meta.append(node("span", "@" + item.account));
    content.append(link, meta);
    row.append(content, node("td", dateText(item.date)), ...Object.keys(metrics).slice(0, 5).map(key => node("td", format(item[key]))));
    return row;
  });
  if (!rows.length) {
    const row = node("tr");
    const cell = node("td", "No content matches these filters.");
    cell.colSpan = 7;
    row.append(cell);
    rows.push(row);
  }
  element("rows").replaceChildren(...rows);
  element("count").textContent = Math.min(filtered.length, resultLimit) + " of " + filtered.length + " items";
  element("more").hidden = filtered.length <= resultLimit;
  element("clear-week").hidden = chosenWeek == null;
  if (chosenWeek != null) element("clear-week").textContent = "Clear week of " + dateText(weekStarts[chosenWeek]);
}

function selectWeek(index, focusWeek = false) {
  chosenWeek = index;
  resultLimit = 12;
  const items = scopedData();
  renderChart(items, focusWeek);
  renderLibrary(items);
}

function setScope(value, index = null) {
  scope = value;
  document.querySelectorAll("[data-scope]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.scope === value));
  });
  renderStats(scopedData());
  selectWeek(index);
}

Object.entries(metrics).forEach(([key, label]) => metricSelect.append(new Option(label, key)));
metricSelect.addEventListener("change", () => renderChart(scopedData()));
document.querySelectorAll("[data-scope]").forEach(button => {
  button.addEventListener("click", () => setScope(button.dataset.scope));
});
milestones.forEach(({ date, title }, index) => {
  const button = node("button", null, "event-button");
  button.type = "button";
  button.append(node("span", dateText(date)), node("span", title));
  button.addEventListener("click", () => {
    eventIndex = index;
    renderEvent();
  });
  element("events").append(button);
});
element("clear-week").addEventListener("click", () => selectWeek(null));
function resetResults() {
  resultLimit = 12;
  renderLibrary(scopedData());
}
element("search").addEventListener("input", resetResults);
element("sort").addEventListener("change", resetResults);
element("more").addEventListener("click", () => {
  resultLimit += 12;
  renderLibrary(scopedData());
});
renderEvent();
setScope("all");
