# Cow Game

## The premise

I spammed [Orteil's Video game generator](https://orteil.dashnet.org/gamegen) until I got one that sounded doable:

>A sim game where you copy-paste horses until you own everything.

I challenge you to play it and let me know if I hit the mark!

## Attribution

The amazingly good 3d models are courtesy of Quaternius, freely available from his website, [quaternius.com](https://quaternius.com/).

## Tech

The website is an SPA developed with [Preact](https://preactjs.com/).

I use [Vite](https://vitejs.dev/) for local dev hosting, as well as doing the build for deployment.

The 3d rendering is provided by [Babylon JS](https://www.babylonjs.com/).

## Development

To run the project localy:

>```
>yarn dev
>```

To build the project:

>```
>yarn build
>```

## Troubleshooting

### Missing modules

Sometimes Vite will fail to load a module that it has not yet seen. This is because it processes modules on-demand, and sometimes fails to serve it up while doing so.

**The solution**: reload the web page.

By the time you reload, Vite should have finished processing the module; it will be served correctly this time.