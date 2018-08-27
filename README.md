**URL Component**

Given a Javascript file URL and exported component name, dynamically render React components.

**Prerequisites:**
- Your javascript file must be compiled into browser compatible code. In other words, no ES6 or Node JS functions.
- A sample library to create an API to perform such compilations can be found here: https://bitbucket.org/atlassian/pkgzip   

**Example Usage: Render React Bootstrap Alert**
```
var url = "https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.32.3/react-bootstrap.min.js"

<URLComponent
  componentName="Alert"
  url={url}
  onComponentLoaded={this.onComponentLoadedCallback}
>
  Alert Text
</URLComponent>
```