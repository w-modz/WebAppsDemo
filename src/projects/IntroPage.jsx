import React from "react";

const sections = [
  {
    title: "Section One",
    subsections: [
      {
        title: "Introduction",
        paragraphs: [
          "Dragée brownie danish bear claw lemon drops lollipop cake. Jujubes sesame snaps candy cupcake oat cake caramels chupa chups tiramisu marzipan. Shortbread tiramisu sweet jelly beans chocolate cake pie.",
          "Icing shortbread wafer chupa chups tart jelly. Pastry lollipop jelly beans caramels croissant halvah gummi bears cake donut. Caramels tiramisu gingerbread lollipop marzipan donut dessert.",
        ],
      },
      {
        title: "Background",
        paragraphs: [
          "Jelly-o cake jelly beans ice cream sweet roll bonbon. Cookie sweet roll biscuit cupcake bear claw pudding jelly candy canes. Sweet roll powder tiramisu chocolate macaroon chupa chups ice cream.",
          "Caramels soufflé cotton candy jelly chocolate cake apple pie marzipan brownie. Cheesecake dessert icing cupcake danish donut jelly-o powder icing. Sweet roll donut pudding tart chocolate cake apple pie.",
        ],
      },
    ],
  },
  {
    title: "Section Two",
    subsections: [
      {
        title: "Main Topic",
        paragraphs: [
          "Tootsie roll cake muffin tiramisu powder chocolate cake halvah. Liquorice cheesecake donut bonbon cake caramels. Liquorice chocolate cake soufflé biscuit wafer. Candy shortbread chocolate cake bars.",
          "Sweet roll donut dessert wafer topping liquorice. Donut jelly cheesecake dessert chupa chups fruitcake chocolate. Ice cream chocolate cake ice cream sweet bonbon topping shortbread.",
        ],
      },
      {
        title: "Details",
        paragraphs: [
          "Bonbon shortbread jelly biscuit chocolate bar lollipop bonbon lemon drops. Cupcake ice cream halvah fruitcake croissant bonbon tiramisu gummies bonbon. Tart jelly dragée tootsie roll pie marshmallow.",
          "Sesame snaps icing soufflé cotton candy tiramisu fruitcake. Jelly-o lemon drops danish liquorice wafer macaroon chocolate. Cotton candy cake jelly beans chupa chups cookie cotton candy.",
        ],
      },
    ],
  },
  {
    title: "Section Three",
    subsections: [
      {
        title: "Summary",
        paragraphs: [
          "Chocolate tiramisu liquorice fruitcake cupcake candy apple pie donut. Bonbon chocolate jelly-o pie toffee jelly beans biscuit cotton candy. Pie tootsie roll soufflé carrot cake oat cake apple pie.",
          "Dessert gingerbread brownie sweet pudding. Ice cream lemon drops caramels icing croissant bear claw carrot cake. Caramels tiramisu jelly-o ice cream icing jelly.",
        ],
      },
    ],
    list: [
      "Gummi bears gummies liquorice jelly beans carrot cake pudding.",
      "Sweet roll jelly sweet roll jelly beans carrot cake oat cake cheesecake chocolate cake.",
      "Powder jujubes carrot cake chocolate cake bonbon chupa chups lollipop chocolate.",
      "Liquorice apple pie bonbon jelly icing. Biscuit topping donut chocolate halvah.",
      "Cake gummies macaroon pie macaroon cheesecake jujubes. Cookie croissant macaroon icing chocolate cake chupa chups.",
      "Gummies cotton candy jujubes shortbread sweet roll. Croissant jelly-o gummies pastry croissant macaroon croissant tiramisu.",
    ],
  },
];

export default function IntroPage() {
  return (
    <main className="project-page intro-page">
      <article className="intro-article">
        <header className="intro-heading">
          <p className="eyebrow">Project A · Editorial layout</p>
          <h1>Wiktor Modzelewski <span>SI Lab1</span></h1>
          <p>A short collection of sections, background, and details.</p>
        </header>
        {sections.map((section, index) => (
          <section className="intro-section" key={section.title}>
            <span className="section-number">0{index + 1}</span>
            <div>
              <h2>{section.title}</h2>
              {section.subsections.map((subsection) => (
                <div className="intro-subsection" key={subsection.title}>
                  <h3>{subsection.title}</h3>
                  {subsection.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              ))}
              {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
            </div>
          </section>
        ))}
        <footer className="intro-footer">© 2025 Lorem Ipsum Example. All rights reserved.</footer>
      </article>
    </main>
  );
}
