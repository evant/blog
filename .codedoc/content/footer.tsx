import { CodedocConfig } from '@codedoc/core';
import { Footer as _Footer, Icon } from '@codedoc/core/components';


export function Footer(config: CodedocConfig, renderer: any) {
  return <_Footer>
    <a href="https://github.com/evant" target="_blank" style="min-width: 120px">GitHub</a>
    <a href="https://evan.tatarka.me/blog/_feed.rss" target="_blank" style="min-width: 120px"><Icon>rss_feed</Icon>RSS</a>
    <iframe src="https://github.com/sponsors/evant/button" title="Sponsor evant" height="35" width="30" style="border: 0; flex: 0; min-width: 120px; background: #212121"></iframe>
  </_Footer>;
}
