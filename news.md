---
title: News And Updates
hero_kicker: Communications
hero_title: Symposium Announcements
hero_text: Official updates regarding deadlines, program releases, invited speakers, and logistics.
---

## Recent Announcements

{% assign posts_count = site.posts | size %}
{% if posts_count > 0 %}
<div class="grid two">
  {% for post in site.posts limit: 6 %}
  <article class="card">
    <p class="small">{{ post.date | date: "%d %b %Y" }}</p>
    <h3>{{ post.title }}</h3>
    <p>{{ post.excerpt | strip_html | truncate: 140 }}</p>
  </article>
  {% endfor %}
</div>
{% else %}
<div class="notice"><p>No announcements are published yet. Check back soon.</p></div>
{% endif %}
