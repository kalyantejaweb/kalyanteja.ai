'use strict';

/** Verified public profiles — update when official business pages are available. */
module.exports = {
  social: {
    linkedin: 'https://www.linkedin.com/in/kalyanbabuykb/',
    github: 'https://github.com/kalyanteja',
    facebook: '',
    instagram: '',
    twitter: '',
  },
  /** Profiles included in JSON-LD sameAs (verified URLs only). */
  schemaSameAs() {
    return [this.social.linkedin, this.social.github].filter(Boolean);
  },
};
