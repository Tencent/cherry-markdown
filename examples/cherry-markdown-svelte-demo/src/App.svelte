<script>
  import NavBar from "./components/NavBar.svelte";
  import NavMenu from "./components/NavMenu.svelte";
  import Content from "./components/Content.svelte";
</script>

<main>
  <div>
    <NavBar/>
    <div class="container">
      <NavMenu/>
      <Content/>
    </div>
  </div>
</main>

<style>
.container {
  max-width: 1241px;
  display: flex;
  flex-direction: row;
}
</style>

