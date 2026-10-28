// עברית. נכתב בעברית, לא מתורגם מהאנגלית. השם תמיד אָנְסִי, עם ניקוד.
import type { MessageKey } from './en'

export const he: Record<MessageKey, string> = {
  'app.name': 'אָנְסִי',
  'app.by': 'מבית Slikk.Dev',
  'app.tagline': 'האתר שלכם נראה מעולה. בשבילכם.',

  'skip.site': 'קפיצה לאתר',
  'skip.panel': 'קפיצה לחוויות',

  'toolbar.back': 'אחורה',
  'toolbar.forward': 'קדימה',
  'toolbar.reload': 'טעינה מחדש',
  'toolbar.stop': 'עצירה',
  'toolbar.settings': 'הגדרות',
  'toolbar.about': 'אודות אָנְסִי',
  'toolbar.theme': 'ערכת נושא בהירה',

  'address.label': 'כתובת האתר',
  'address.placeholder': 'הקלידו את כתובת האתר שלכם, למשל example.com',
  'address.go': 'פתיחה',
  'address.invalid': 'זה לא נראה כמו כתובת אינטרנט. נסו משהו כמו example.com.',

  'site.loading': 'טוען…',
  'site.empty': 'אין אתר פתוח',
  'site.focus': 'קפיצה לתוך האתר',
  'site.region': 'האתר שלכם',

  'welcome.title': 'האתר שלכם נראה מעולה. בשבילכם.',
  'welcome.body':
    'אָנְסִי מאפשר לכם להשתמש באתר שלכם כמו שמשתמשים בו אנשים עם מוגבלות, עם הכלים שהם נעזרים בהם. הקלידו למעלה את כתובת האתר כדי להתחיל.',
  'welcome.hint': 'טיפ: לחיצה על {shortcut} מחזירה אתכם לשורת הכתובת בכל רגע.',

  'error.title': 'אָנְסִי לא הצליח לפתוח את הדף הזה',
  'error.body': 'בדקו את הכתובת ואת החיבור לאינטרנט, ונסו שוב.',
  'error.retry': 'לנסות שוב',

  'panel.title': 'חוויות',
  'panel.intro':
    'בוחרים חוויה. כל חוויה משנה איך האתר שלכם נראה, נשמע או מגיב, כך שתפגשו את המחסום בעצמכם.',
  'panel.soon': 'בקרוב',

  'exp.colorBlindness': 'עיוורון צבעים',
  'exp.blurLowContrast': 'ראייה מטושטשת וניגודיות נמוכה',
  'exp.reader': 'קורא המסך Ansy Reader',
  'exp.zoom': 'הגדלה ל־200% ול־400%',
  'exp.largeText': 'טקסט גדול וריווח רחב',
  'exp.highContrast': 'ניגודיות גבוהה',
  'exp.keyboard': 'מקלדת בלבד',
  'exp.noSound': 'בלי סאונד',
  'exp.motion': 'רגישות לתנועה',
  'exp.scan': 'סריקה אוטומטית',

  'settings.title': 'הגדרות',
  'settings.language': 'שפה',
  'settings.theme': 'ערכת נושא',
  'settings.theme.dark': 'כהה',
  'settings.theme.light': 'בהירה',
  'settings.theme.system': 'לפי המערכת',
  'settings.updates': 'לבדוק אם יש עדכונים כשאָנְסִי נפתח',
  'settings.close': 'סגירה',

  'lang.en': 'English',
  'lang.he': 'עברית',

  'about.title': 'אודות אָנְסִי',
  'about.version': 'גרסה {version}',
  'about.body':
    'דפדפן חינמי בקוד פתוח למחשב, שמאפשר לחוות את האתר שלכם כמו שחווים אותו אנשים עם מוגבלות, כולל הכלים שהם נעזרים בהם. אָנְסִי הוא כלי לבדיקה ולהזדהות. הוא אף פעם לא משנה את האתר שלכם.',
  'about.disclaimer':
    'אָנְסִי מראה איך האתר שלכם מתנהג עבור חלק מהאנשים עם מוגבלות והכלים שהם נעזרים בהם. הוא לא יכול לאשר שהאתר עומד בדרישות WCAG, תקן 5568, ה־ADA או חוק הנגישות האירופי. רק בדיקה מלאה בידי איש מקצוע מוסמך יכולה.',
  'about.license':
    'הקוד ברישיון MIT. השם והלוגו של Slikk.Dev הם סימני מסחר של Slikk.Dev, וכל הזכויות בהם שמורות.',
  'about.source': 'קוד המקור ב־GitHub',
  'about.builtBy': 'נבנה על ידי',
  'about.credit': 'נבנה על ידי Slikk.Dev, פותח את slikk.dev בדפדפן שלכם',
  'about.close': 'סגירה',

  'menu.file': 'קובץ',
  'menu.edit': 'עריכה',
  'menu.view': 'תצוגה',
  'menu.window': 'חלון',
  'menu.help': 'עזרה',
  'menu.quit': 'יציאה מאָנְסִי',
  'menu.undo': 'ביטול',
  'menu.redo': 'ביצוע מחדש',
  'menu.cut': 'גזירה',
  'menu.copy': 'העתקה',
  'menu.paste': 'הדבקה',
  'menu.selectAll': 'בחירת הכול',
  'menu.toggleFullScreen': 'מסך מלא',
  'menu.minimize': 'מזעור',
  'menu.close': 'סגירת החלון',
  'menu.about': 'אודות אָנְסִי',
  'menu.github': 'אָנְסִי ב־GitHub',
  'menu.website': 'האתר של אָנְסִי',
  'panel.on': 'פעיל',
  'panel.turnOn': 'הפעלה',
  'panel.turnOff': 'כיבוי',
  'panel.noSite': 'קודם פותחים את האתר, ואז מפעילים חוויה.',
  'panel.whatHappens': 'מה משתנה',
  'panel.lookFor': 'למה לשים לב',
  'panel.noticed': 'מה אָנְסִי שם לב אליו בעמוד הזה',
  'panel.noticedPending': 'בודק את העמוד…',
  'panel.status.on': '{name}: פעיל',
  'panel.status.off': '{name}: כבוי',
  'panel.options': 'אפשרויות',
  'panel.back': 'כל החוויות',

  'fidelity.label': 'נאמנות',
  'fidelity.high': 'קרוב מאוד למציאות',
  'fidelity.medium': 'קירוב',

  'exp.colorBlindness.what':
    'אָנְסִי צובע את האתר מחדש כמו שהסימולציה של כרום עושה, לפי סוג עיוורון הצבעים שבחרתם. בערך אחד מכל 12 גברים ואחת מכל 200 נשים רואים צבעים כך.',
  'exp.colorBlindness.look':
    'כל דבר שמסופר בצבע בלבד: שגיאה באדום, ״במלאי״ בירוק, שלב מודגש.\nקישורים שנבדלים מהטקסט שסביבם רק בצבע.\nגרפים, מידות או דוגמיות צבע שכבר אי אפשר להבדיל ביניהם.',
  'exp.colorBlindness.fidelity':
    'הסימולציה של Chromium עצמו, אותה אחת שכלי המפתחים של כרום משתמשים בה.',
  'exp.colorBlindness.mode': 'סוג',
  'exp.vision.deuteranopia': 'אדום-ירוק (דאוטרנופיה, הנפוץ ביותר)',
  'exp.vision.protanopia': 'אדום-ירוק (פרוטנופיה)',
  'exp.vision.tritanopia': 'כחול-צהוב (טריטנופיה)',
  'exp.vision.achromatopsia': 'בלי צבע בכלל (אכרומטופסיה)',

  'exp.blurLowContrast.what':
    'אָנְסִי מטשטש את העמוד או מרוקן ממנו את הניגודיות, כמו שהוא נראה למי שיש לו ראייה חלשה, קטרקט, או מסך סדוק בשמש.',
  'exp.blurLowContrast.look':
    'טקסט קטן או דק שכבר אי אפשר לקרוא.\nטקסט אפור על לבן, טקסט מציין מקום ותוויות בהירות שנעלמות.\nכפתורים ושדות שהקצוות שלהם נעלמים.',
  'exp.blurLowContrast.fidelity':
    'רמת טשטוש אחת ורמת ניגודיות אחת; ראייה חלשה אמיתית שונה מאוד מאדם לאדם.',
  'exp.blurLowContrast.mode': 'סוג',
  'exp.blur.blurredVision': 'ראייה מטושטשת',
  'exp.blur.reducedContrast': 'ניגודיות נמוכה',

  'exp.zoom.what':
    'אָנְסִי מגדיל את האתר כמו שדפדפן עושה, או מציג אותו ברוחב 320 פיקסלים, הרוחב הצר ביותר שעמוד עדיין חייב לעבוד בו.',
  'exp.zoom.look':
    'גלילה הצידה כדי לקרוא שורה.\nתוכן חתוך, חופף, או מוסתר מאחורי משהו אחר.\nתפריטים וכפתורים שכבר אי אפשר להגיע אליהם.',
  'exp.zoom.fidelity': 'הגדלה אמיתית של הדפדפן, בדיוק כמו ללחוץ Ctrl ופלוס.',
  'exp.zoom.level': 'הגדלה',
  'exp.zoom.200': '200%',
  'exp.zoom.400': '400%',
  'exp.zoom.narrow': 'להציג את האתר ברוחב 320 פיקסלים במקום',

  'exp.largeText.what':
    'אָנְסִי מכפיל את גודל הטקסט שמוגדר בדפדפן, כמו שאנשים רבים מגדירים בדפדפן שלהם, ומרחיב את הריווח בין שורות, מילים ואותיות.',
  'exp.largeText.look':
    'טקסט שלא גדל בכלל.\nטקסט חתוך, חופף, או שנדחף החוצה מהתיבה שלו.\nכפתורים שהתווית שלהם כבר לא נכנסת.',
  'exp.largeText.fidelity': 'הגדרת גודל הגופן של הדפדפן עצמו, והריווח המדויק ש־WCAG בודק איתו.',
  'exp.largeText.size': 'טקסט ב־200%',
  'exp.largeText.spacing': 'ריווח רחב יותר בין שורות, מילים ואותיות',

  'exp.highContrast.what':
    'אָנְסִי צובע את האתר מחדש בערכת ניגודיות גבוהה של המערכת, כמו ש־Windows עושה למי שמפעיל אותה. צבעים ורקעים מוחלפים; נשארים רק קווי מתאר וטקסט.',
  'exp.highContrast.look':
    'כפתורים, קישורים או שדות שנעלמו.\nטקסט שצרוב בתוך תמונות, שנשאר בדיוק כמו שהיה.\nמצבים שמסופרים בצבע בלבד: איזו לשונית פתוחה, באיזה שדה יש שגיאה.',
  'exp.highContrast.fidelity':
    'מצב forced-colors של Chromium, אותו מנוע שמאחורי ערכות הניגודיות של Windows.',

  'exp.motion.what':
    'אָנְסִי אומר לאתר שהמבקר ביקש פחות תנועה, ואז סופר מה ממשיך לזוז. תנועה יכולה לגרום לסחרחורת, בחילה או מיגרנה.',
  'exp.motion.look':
    'אנימציות שממשיכות לרוץ אחרי הבקשה.\nוידאו או אודיו שמתחיל לבד.\nקרוסלות וטיקרים בלי דרך לעצור אותם.',
  'exp.motion.fidelity': 'אותו אות ״הפחתת תנועה״ שמערכת ההפעלה שולחת.',
  'exp.motion.animations': '{count} אנימציות עדיין רצות',
  'exp.motion.autoplay': '{count} פריטי מדיה מתנגנים לבד',
  'exp.motion.calm': 'שום דבר לא המשיך לזוז',

  'exp.noSound.what':
    'אָנְסִי משתיק את האתר ובודק בכל וידאו ונגן אם יש כתוביות. בלעדיהן, מה שהסאונד אמר פשוט אבד.',
  'exp.noSound.look':
    'סרטונים בלי כתוביות.\nכל דבר שמוסבר בסאונד בלבד: צלצול, קול, צפצוף על שגיאה.\nנגנים של YouTube או Vimeo: בודקים את הכתוביות שלהם ידנית.',
  'exp.noSound.fidelity':
    'ההשתקה מדויקת; בדיקת הכתוביות מכסה את המדיה של העמוד עצמו ומציינת את הנגנים שאי אפשר להציץ לתוכם.',
  'exp.noSound.media': '{count} פריטי וידאו או אודיו',
  'exp.noSound.noCaptions': '{count} בלי כתוביות',
  'exp.noSound.players': '{count} נגנים מוטמעים לבדוק ידנית',
  'exp.noSound.none': 'אין וידאו או אודיו בעמוד הזה',

  'exp.reader.what': 'קורא מסך מובנה עם סמן וירטואלי ותמליל גלוי. מגיע בשלב מאוחר יותר.',
  'exp.keyboard.what': 'בלי עכבר, עם טבעת פוקוס בולטת ומסלול של סדר המעבר. מגיע בשלב מאוחר יותר.',
  'exp.scan.what': 'בדיקה אוטומטית של העמוד מול WCAG, מוסברת במילים פשוטות. מגיע בשלב מאוחר יותר.',
}
