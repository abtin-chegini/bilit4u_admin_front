import React, { FunctionComponent, useEffect, useState } from "react";
import AccordionCustom from "@/components/ui/AccordionCustom";

// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "../ui/accordion";

const FAQ: FunctionComponent = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | undefined>(1);

  return (
    <div className="w-full flex flex-col items-start gap-y-10 p-16 font-IranYekanRegular" dir="rtl">
      <div className="flex flex-col items-start gap-y-2">
        <div className="font-IranYekanBold text-black xl:text-2xl lg:text-xl md:text-lg sm:text-lg xs:text-lg text-right">
          لورم ایپسوم سوالات متداول
        </div>
        <div className="xl:text-xl lg:text-lg md:text-base sm:text-base xs:text-sm text-black text-right">
          این متن برای لورم ایپسوم می‌باشد
        </div>
      </div>
      <div className="flex flex-col gap-y-6 w-full">

        <AccordionCustom
          title="این متن برای لورم ایپسوم تیتر می‌باشد"
          description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد. "
          active={activeAccordion}
          setActive={setActiveAccordion}
          id={1}
        />
        <AccordionCustom
          title="این متن برای لورم ایپسوم تیتر می‌باشد"
          description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد. "
          active={activeAccordion}
          setActive={setActiveAccordion}
          id={2}
        />
        <AccordionCustom
          title="این متن برای لورم ایپسوم تیتر می‌باشد"
          description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد. "
          active={activeAccordion}
          setActive={setActiveAccordion}
          id={3}
        />
        <AccordionCustom
          title="این متن برای لورم ایپسوم تیتر می‌باشد"
          description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد. "
          active={activeAccordion}
          setActive={setActiveAccordion}
          id={4}
        />
      </div>
    </div>
  );
};

export default FAQ;
