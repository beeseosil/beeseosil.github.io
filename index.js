const articlesContainer = document.getElementById("articles-container");

function parseAndRender(jsonString) {
  try {
    const parsedData = JSON.parse(jsonString);
    const articles = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    articlesContainer.innerHTML = "";
    
    articles.forEach(article => {
      const paperCanvas = document.createElement("div");
      paperCanvas.className = "paper-canvas p-48 mb-24";
      
      const rawContent = article.content;
      const contentHtml = Array.isArray(rawContent) ? rawContent.join("\n") : rawContent;
      
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
      let accumulatedItems = [];
      
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
          const colCount = accumulatedImages.length;
          imgContainer.className = "letter-img-grid cols-" + colCount;
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
      
      function flushItems() {
        if (accumulatedItems.length === 0) {
          return;
        }
        
        const ulEl = document.createElement("ul");
        ulEl.className = "letter-list mb-18";
        
        accumulatedItems.forEach(itemNode => {
          const liEl = document.createElement("li");
          liEl.className = "letter-main fs-4 mb-6";
          liEl.innerHTML = parseInlineTags(itemNode);
          ulEl.appendChild(liEl);
        });
        
        paperCanvas.appendChild(ulEl);
        accumulatedItems = [];
      }
      
      children.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          
          if (tagName === "img") {
            flushItems();
            accumulatedImages.push(node);
          } else if (tagName === "item") {
            flushImages();
            accumulatedItems.push(node);
          } else {
            flushImages();
            flushItems();
            
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
      flushItems();
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

fetch("article.json?t=" + new Date().getTime())
  .then(response => response.json())
  .then(data => {
    parseAndRender(JSON.stringify(data));
  })
  .catch(error => {
    articlesContainer.innerHTML = `
      <div class="alert alert-danger p-24 mb-24">
        <h4 class="alert-heading font-weight-bold mb-12">Failed to Load article.json</h4>
        <p class="mb-12">The application could not retrieve the article content dynamically. If you are opening the HTML file directly in your browser (via the file:// protocol), standard security restrictions (CORS) block local data access.</p>
        <p class="mb-0"><strong>Recommended Fix:</strong> Run a local web server (e.g., <code>python -m http.server</code>) or access your live deployment at <strong>beeseosil.github.io</strong>.</p>
      </div>
    `;
  });
