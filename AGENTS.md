<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the voice assistant as an isolated global widget; dynamically import the Vapi browser SDK only on a user-initiated start to preserve SSR and existing shopping features.
- Vapi uses public VITE configuration only; never put private credentials in browser configuration. The existing Vapi assistant owns voice conversation knowledge.
