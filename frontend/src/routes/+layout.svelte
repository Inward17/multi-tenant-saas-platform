<script>
  import "../app.css";
  import "$lib/stores/theme";
  import Toast from "$lib/components/ui/Toast.svelte";
  let { children } = $props();
</script>

{@render children()}
<Toast />
