// اسم ذاكرة التخزين المؤقت وإصدارها
const CACHE_NAME = 'student-violations-cache-v1';

// الملفات الأساسية التي يجب تخزينها
const URLS_TO_CACHE = [
  './تطبيق مخالفات الطلاب.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap'
];

// 1. تثبيت عامل الخدمة
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. تفعيل عامل الخدمة وتنظيف ذاكرة التخزين المؤقت القديمة
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. اعتراض الطلبات والرد من ذاكرة التخزين المؤقت
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات التي ليست من نوع GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا وجدنا الطلب في الكاش، نرجعه
        if (response) {
          return response;
        }
        
        // إذا لم نجده، نذهب إلى الشبكة
        return fetch(event.request)
          .then((networkResponse) => {
            // التحقق من أن الاستجابة صالحة قبل تخزينها
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // نسخ الاستجابة لأنها يمكن استخدامها مرة واحدة فقط
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // في حال فشل الاتصال بالشبكة تماماً (أنت غير متصل)
            // يمكننا هنا إرجاع صفحة "أنت غير متصل" احتياطية إذا أردنا
            console.log('Service Worker: Fetch failed, user is offline.');
          });
      })
  );
});