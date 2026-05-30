const defaultJson = {
  id: "0",
  content: `
<title>Grodan Cultivation Request</title>

<subtitle>System</subtitle>
<text>The system monitoring setup tracks propagation progress and ambient parameters.</text>
<img src='./webapp-overview.png'>img</img>
<caption>System</caption>

<subtitle>Strawberries</subtitle>
<text>First seedling propagation and second anthesis phases show promising vegetative growth.</text>
<img src='./strawberry-1st-seedling-propagation.jpg'>img</img>
<img src='./strawberry-2nd-overview.jpg'>img</img>
<caption>Strawberries</caption>

<subtitle>Tomatoes</subtitle>
<text>Tomato starter plants developing healthy root systems inside Grodan cubes.</text>
<img src='./tomato-3rd-starter.jpg'>img</img>
<img src='./tomato-3rd-fruit.jpg'>img</img>
<img src='./tomato-3rd-upper.jpg'>img</img>
<caption>Tomatoes</caption>
`
};

const articlesContainer = document.getElementById("articles-container");

function parseAndRender(jsonString) {
  try {
    const parsedData = JSON.parse(jsonString);
    const articles = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    articlesContainer.innerHTML = "";
    
    articles.forEach(article => {
      const paperCanvas = document.createElement("div");
      paperCanvas.className = "paper-canvas p-48 mb-24";
      
      const contentHtml = article.content;
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<root>${contentHtml}</root>`, "text/xml");
      
      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        paperCanvas.innerHTML = `<div class="alert alert-danger">XML Parsing Error: Please check your content XML tags.</div>`;
        articlesContainer.appendChild(paperCanvas);
        return;
      }
      
      const root = doc.documentElement;
      const children = Array.from(root.childNodes);
      
      let accumulatedImages = [];
      
      function flushImages() {
        if (accumulatedImages.length === 0) {
          return;
        }
        
        const imgContainer = document.createElement("div");
        if (accumulatedImages.length === 1) {
          imgContainer.className = "letter-img-container";
          const imgEl = document.createElement("img");
          imgEl.className = "letter-img";
          imgEl.src = accumulatedImages[0].getAttribute("src") || "";
          imgContainer.appendChild(imgEl);
        } else {
          imgContainer.className = "letter-img-grid";
          accumulatedImages.forEach(imgNode => {
            const wrapper = document.createElement("div");
            wrapper.className = "letter-img-grid-item";
            const imgEl = document.createElement("img");
            imgEl.className = "letter-img";
            imgEl.src = imgNode.getAttribute("src") || "";
            wrapper.appendChild(imgEl);
            imgContainer.appendChild(wrapper);
          });
        }
        
        paperCanvas.appendChild(imgContainer);
        accumulatedImages = [];
      }
      
      children.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          
          if (tagName === "img") {
            accumulatedImages.push(node);
          } else {
            flushImages();
            
            if (tagName === "title") {
              const titleEl = document.createElement("h1");
              titleEl.className = "letter-title fs-2";
              titleEl.textContent = node.textContent;
              paperCanvas.appendChild(titleEl);
            } else if (tagName === "subtitle") {
              const subEl = document.createElement("h2");
              subEl.className = "letter-subtitle fs-3";
              subEl.textContent = node.textContent;
              paperCanvas.appendChild(subEl);
            } else if (tagName === "text") {
              const textEl = document.createElement("p");
              textEl.className = "letter-main fs-4";
              textEl.innerHTML = parseInlineTags(node);
              paperCanvas.appendChild(textEl);
            } else if (tagName === "caption") {
              const captionEl = document.createElement("p");
              captionEl.className = "letter-caption fs-4";
              captionEl.textContent = node.textContent;
              paperCanvas.appendChild(captionEl);
            }
          }
        }
      });
      
      flushImages();
      articlesContainer.appendChild(paperCanvas);
    });
    
  } catch (error) {
    articlesContainer.innerHTML = `<div class="alert alert-danger">JSON Parsing Error: ${error.message}</div>`;
  }
}

function parseInlineTags(node) {
  let html = "";
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      html += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "emphasize") {
      html += `<span class="letter-emphasize">${child.textContent}</span>`;
    }
  });
  return html;
}

fetch("article.json")
  .then(response => response.json())
  .then(data => {
    parseAndRender(JSON.stringify(data));
  })
  .catch(() => {
    parseAndRender(JSON.stringify(defaultJson));
  });
