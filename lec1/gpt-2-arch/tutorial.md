# llm architecture

the first real llm was GPT-2, trained by openai on 40GB of text scraped from webpages linked on reddit posts with at least 3 karma. that's it! it just predicts the next token. (this is referred to as pretraining)

this is the simplest possible llm architecture to understand, implement, and every architecture after this basically sought to improve on the following metrics:

- more quality per unit of compute
- lower inference cost, especially at longer context
- more stable training at large scales
- massively increase the number of tokens trained on, parameters, and time training
