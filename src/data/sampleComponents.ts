import { ComponentItem } from '../types';

export const INITIAL_COMPONENTS: ComponentItem[] = [
  // --- PRE-TESTED PROJECT KITS ---
  {
    id: 'c2c-kit-001',
    name: 'Smart IoT Environmental & Weather Monitor Kit (ESP32 + DHT11 + MQ-135 + OLED Display)',
    category: 'project_kits',
    categoryLabel: 'Project Kits',
    transactionType: 'rent',
    samplePrice: '₹85 / week',
    priceNumeric: 85,
    originalPriceNumeric: 890,
    depositAmount: 150,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Venkata Sai Kumar',
    sellerRollNumber: '22A81A0512',
    sellerYear: '3rd Year',
    sellerDept: 'Computer Science & Engineering (CSE)',
    sellerEmail: '22a81a0512@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Complete, pre-tested IoT station kit used for our 3rd-year mini-project. Includes ESP32 NodeMCU, calibrated DHT11 temperature/humidity sensor, MQ-135 air quality sensor, 0.96" I2C OLED display (128x64), 400-tie breadboard, and pre-routed DuPont wiring loom. Tested with Arduino IDE 2.3 and Blynk cloud.',
    specs: [
      'ESP32 Dual-Core 240MHz Wi-Fi & Bluetooth MCU',
      'DHT11 Temperature & Relative Humidity Sensor',
      'MQ-135 Hazardous Gas & Air Quality Sensor',
      '0.96" I2C Blue/Yellow OLED (Address: 0x3C)',
      'Pre-cut color-coded jumper loom + microUSB cable',
      '48-hour testing guarantee included'
    ],
    recommendedLabs: ['Internet of Things (IoT) Lab', 'Embedded Systems Capstone', 'Sensors Interfacing Mini-Project'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Today',
    iconType: 'kit',
    photoUrl: '/assets/images/esp32_devkit_1792860917627.jpg',
    weightGrams: 280,
    testingPeriodHours: 48,
    isProjectKit: true,
    kitDetails: {
      partsList: [
        { name: 'ESP32 NodeMCU-32S Dev Board', qty: 1, tested: true },
        { name: 'DHT11 Temp/Humidity Module', qty: 1, tested: true },
        { name: 'MQ-135 Air Quality Sensor Module', qty: 1, tested: true },
        { name: '0.96" SSD1306 I2C OLED (128x64)', qty: 1, tested: true },
        { name: 'MB-102 Half-Size Breadboard (400 Tie)', qty: 1, tested: true },
        { name: 'Female-to-Male Jumper Wires (20cm)', qty: 12, tested: true }
      ],
      compatibility: 'Fully compatible with Arduino IDE 2.x and ESP-IDF. Powered via 5V Micro-USB or 3.3V pin. Logic level: 3.3V (all sensors pre-configured for safe 3.3V ADC inputs).',
      setupInstructions: '1. Plug ESP32 into center divider of breadboard.\\n2. Connect OLED: VCC->3.3V, GND->GND, SDA->GPIO21, SCL->GPIO22.\\n3. Connect DHT11 DATA to GPIO4 with 10k pull-up resistor.\\n4. Connect MQ-135 AOUT to GPIO34 (ADC1).\\n5. Open Arduino IDE, install "Adafruit SSD1306" and "DHT sensor library", select "DOIT ESP32 DEVKIT V1", compile and flash sample code.',
      wiringDiagramUrl: '/assets/images/esp32_devkit_1792860917627.jpg',
      sampleCode: `// Sri Vasavi Engineering College - Circuit2Circuit Verified Sample Code
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define DHTPIN 4
#define DHTTYPE DHT11

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed!");
    for(;;);
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(10, 20);
  display.print("SVEC IoT Lab Ready");
  display.display();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int gasRaw = analogRead(34);
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("Circuit2Circuit IoT");
  display.setCursor(0, 20);
  display.printf("Temp: %.1f C", t);
  display.setCursor(0, 36);
  display.printf("Humidity: %.1f %%", h);
  display.setCursor(0, 52);
  display.printf("Air Quality: %d", gasRaw);
  display.display();
  delay(2000);
}`,
      targetDomain: 'Internet of Things (IoT) & Smart Campus'
    }
  },
  {
    id: 'c2c-kit-002',
    name: 'Obstacle Avoiding Robotic Rover Project Kit (Arduino Uno R3 + L298N + HC-SR04 + 2WD Chassis)',
    category: 'project_kits',
    categoryLabel: 'Project Kits',
    transactionType: 'sell',
    samplePrice: '₹480',
    priceNumeric: 480,
    originalPriceNumeric: 1250,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Kalyan Chakravarthy',
    sellerRollNumber: '21A81A0445',
    sellerYear: '4th Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '21a81a0445@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    description: 'Graduating senior selling our complete 4th-year autonomous robotics kit! Pre-assembled with acrylic chassis, dual TT gear motors with rubber wheels, Arduino Uno R3, L298N dual H-bridge motor driver, SG90 servo turret, HC-SR04 ultrasonic sensor, and 2x 18650 battery holder with switch. Bench-tested in Block B lab.',
    specs: [
      'Arduino Uno R3 ATmega328P with CH340 USB interface',
      'L298N Dual Motor Driver with 5V onboard regulator',
      'HC-SR04 Ultrasonic Sonar mounted on SG90 Servo Turret',
      'Dual TT Gear Motors (1:48 reduction) with high-traction wheels',
      'Tested obstacle-detection logic code included'
    ],
    recommendedLabs: ['Microcontrollers Lab', 'Robotics and Automation Capstone', 'Autonomous Systems'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Yesterday',
    iconType: 'kit',
    photoUrl: '/assets/images/arduino_uno_1792860916720.jpg',
    weightGrams: 420,
    testingPeriodHours: 48,
    isProjectKit: true,
    kitDetails: {
      partsList: [
        { name: 'Arduino Uno R3 ATmega328P', qty: 1, tested: true },
        { name: 'L298N Dual H-Bridge Driver Board', qty: 1, tested: true },
        { name: 'HC-SR04 Ultrasonic Module', qty: 1, tested: true },
        { name: 'TowerPro SG90 9g Micro Servo', qty: 1, tested: true },
        { name: 'TT Gear Motors & Wheels (Pair)', qty: 2, tested: true },
        { name: 'Laser-Cut Acrylic Chassis + Castor', qty: 1, tested: true },
        { name: 'Dual 18650 Battery Case with Toggle Switch', qty: 1, tested: true }
      ],
      compatibility: 'Runs on 7.4V - 9V battery power. Arduino IDE compatible. Motor driver logic connects directly to Arduino digital pins 5, 6, 9, 10.',
      setupInstructions: '1. Connect motor left to L298N OUT1/OUT2, right to OUT3/OUT4.\\n2. Connect battery negative to L298N GND AND Arduino GND (common ground essential!).\\n3. Connect battery positive (7.4V) to L298N 12V terminal, and L298N 5V out to Arduino Vin/5V.\\n4. Servo signal on pin 11, Ultrasonic Trig on pin 8, Echo on pin 7.\\n5. Flash provided obstacle avoidance sketch.',
      sampleCode: `// Circuit2Circuit Obstacle Avoiding Rover Controller
#include <Servo.h>

#define TRIG_PIN 8
#define ECHO_PIN 7
#define IN1 5
#define IN2 6
#define IN3 9
#define IN4 10

Servo scanServo;

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2;
}

void forward() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
}

void stopMotors() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
}

void turnRight() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
  delay(400);
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  scanServo.attach(11);
  scanServo.write(90);
}

void loop() {
  long d = getDistance();
  if (d < 25) {
    stopMotors();
    delay(200);
    turnRight();
  } else {
    forward();
  }
  delay(50);
}`,
      targetDomain: 'Robotics & Mechatronics'
    }
  },

  // --- INDIVIDUAL COMPONENTS (MICROCONTROLLERS, SENSORS, PROTOTYPING, PASSIVES) ---
  {
    id: 'c2c-001',
    name: 'Arduino Uno R3 Microcontroller Board (with USB A-B Cable)',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    transactionType: 'rent',
    samplePrice: '₹40 / week',
    priceNumeric: 40,
    originalPriceNumeric: 450,
    depositAmount: 100,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Vikramaditya S.',
    sellerRollNumber: '22A81A0412',
    sellerYear: '3rd Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '22a81a0412@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    description: 'ATmega328P microcontroller board with CH340 chip. Tested with Arduino IDE 2.3. Includes a 30cm blue USB cable. Perfect for 2nd/3rd year microcontrollers & embedded systems lab assignments.',
    specs: ['ATmega328P @ 16 MHz', '14 Digital I/O Pins (6 PWM)', '6 Analog Inputs', 'Operating Voltage: 5V', 'Tested Blink sketch'],
    recommendedLabs: ['Basic Electrical Lab (1st Yr)', 'Microprocessor & Microcontroller Lab (2nd/3rd Yr)', 'Mini Projects'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '2 days ago',
    iconType: 'microcontroller',
    photoUrl: '/assets/images/arduino_uno_1792860916720.jpg',
    weightGrams: 45,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-002',
    name: 'Solderless Breadboard (830 Tie Points) + Power Rails',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    transactionType: 'donate',
    samplePrice: 'Free (Donation)',
    priceNumeric: 0,
    originalPriceNumeric: 160,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Sneha Patel',
    sellerRollNumber: '21A81A0234',
    sellerYear: '4th Year',
    sellerDept: 'Electrical & Electronics Engineering (EEE)',
    sellerEmail: '21a81a0234@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Donating to any junior in need for 1st or 2nd year labs! Standard MB-102 breadboard with sticky foam backing and clear red/blue power bus markings. Clips are firm, zero burnt holes.',
    specs: ['830 Total Contact Points', 'Dual Positive/Negative Distribution Strips', 'Fits standard 0.1" pitch DIP ICs', 'High elasticity nickel-plated contacts'],
    recommendedLabs: ['Basic Electrical & Electronics Lab (1st Yr)', 'Analog Electronics Lab (2nd Yr)', 'Logic Design Lab'],
    targetYears: ['1st Year', '2nd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Yesterday',
    iconType: 'breadboard',
    photoUrl: '/assets/images/solderless_breadboard_1793035175411.jpg',
    weightGrams: 90,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-003',
    name: 'Assorted Resistors (1/4W Metal Film, 300 Pcs Box, 10Ω - 1MΩ)',
    category: 'passives',
    categoryLabel: 'Passive Components',
    transactionType: 'sell',
    samplePrice: '₹95',
    priceNumeric: 95,
    originalPriceNumeric: 220,
    condition: 'Brand New / Sealed',
    sellerName: 'Harish Nair',
    sellerRollNumber: '21A81A0315',
    sellerYear: '4th Year',
    sellerDept: 'Mechanical Engineering (MECH)',
    sellerEmail: '21a81a0315@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Student Canteen Central Plaza',
    description: 'Bought a mega pack for our final year automated sorting capstone. Selling our leftover sealed compartments: 30 popular values including 220Ω, 330Ω, 1kΩ, 4.7kΩ, 10kΩ, 100kΩ.',
    specs: ['30 Values × 10 pcs each', '±1% Tolerance Metal Film', 'Pre-sorted in labeled paper strips', '0.25 Watt rating'],
    recommendedLabs: ['All BTech Lab Courses', 'Circuits & Networks Lab', 'Sensors Interfacing'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '3 days ago',
    iconType: 'passive',
    photoUrl: '/assets/images/resistor_assortment_1793035150193.jpg',
    weightGrams: 60,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-004',
    name: 'Dupont Jumper Wires 120-Piece Multi-Ribbon Pack (M-M, M-F, F-F)',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    transactionType: 'sell',
    samplePrice: '₹120',
    priceNumeric: 120,
    originalPriceNumeric: 250,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Rhea Sen',
    sellerRollNumber: '21A81A0589',
    sellerYear: '4th Year',
    sellerDept: 'Computer Science & Engineering (CSE)',
    sellerEmail: '21a81a0589@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'CSE Dept - AI & Project Innovation Lab (Block A, 1st Floor)',
    description: 'Complete set of 40x Male-to-Male, 40x Male-to-Female, and 40x Female-to-Female 20cm flexible copper jumpers. Essential for connecting sensor modules to microcontrollers.',
    specs: ['20cm (8-inch) length', 'Standard 2.54mm pin spacing', '10 distinct wire colors for easy tracing', 'Stranded copper core'],
    recommendedLabs: ['BEE Lab', 'Microcontroller Lab', 'IoT & Embedded Projects'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '4 days ago',
    iconType: 'wires',
    photoUrl: '/assets/images/jumper_wires_1793035149920.jpg',
    weightGrams: 85,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-005',
    name: 'HC-SR04 Ultrasonic Distance Sensor + Mounting Bracket',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹25 / week',
    priceNumeric: 25,
    originalPriceNumeric: 140,
    depositAmount: 50,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Karthik Raja',
    sellerRollNumber: '22A81A0456',
    sellerYear: '3rd Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '22a81a0456@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Mechanical Workshop & Fabrication Plaza',
    description: 'Non-contact ultrasonic ranging module with 2cm to 400cm detection distance. Pin-tested on 5V VCC, GND, Trigger, and Echo pins. Ideal for obstacle-avoiding car or proximity labs.',
    specs: ['Operating Voltage: 5V DC', 'Ranging: 2cm - 400cm', 'Measuring Angle: 15°', 'Trigger Signal: 10µs TTL pulse'],
    recommendedLabs: ['Sensors & Transducers Lab (2nd Yr)', 'Robotics Lab', 'Autonomous Systems Mini Project'],
    targetYears: ['2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '5 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/ultrasonic_sensor_1792860917671.jpg',
    weightGrams: 20,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-006',
    name: 'Capacitor Lab Pack (80 Pcs: Electrolytic & 0.1uF Ceramic)',
    category: 'passives',
    categoryLabel: 'Passive Components',
    transactionType: 'donate',
    samplePrice: 'Free (Donation)',
    priceNumeric: 0,
    originalPriceNumeric: 180,
    condition: 'Functional Spares',
    sellerName: 'Aman Verma',
    sellerRollNumber: '21A81A0208',
    sellerYear: '4th Year',
    sellerDept: 'Electrical & Electronics Engineering (EEE)',
    sellerEmail: '21a81a0208@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'EEE Dept - Electrical Machines & Power Lab (Block C)',
    description: 'Clearing out components from our power electronics project. Contains 10µF, 47µF, 100µF, 220µF, 470µF 25V electrolytics plus 100nF (0.1µF 104) ceramic decoupling caps.',
    specs: ['Working Voltage: 16V to 50V', 'Includes 0.1µF ceramic decoupling caps', 'Radial lead design for breadboards', 'Discharged & sorted safely'],
    recommendedLabs: ['Analog Circuits Lab', 'Power Electronics Lab', 'Filter Design Experiments'],
    targetYears: ['2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '1 day ago',
    iconType: 'passive',
    photoUrl: '/assets/images/capacitors_pack_1793035151474.jpg',
    weightGrams: 50,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-007',
    name: 'ESP32 Dual-Core Wi-Fi & Bluetooth Development Board (NodeMCU-32S)',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    transactionType: 'sell',
    samplePrice: '₹340',
    priceNumeric: 340,
    originalPriceNumeric: 550,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Divya Krishnan',
    sellerRollNumber: '21A81A1204',
    sellerYear: '4th Year',
    sellerDept: 'Information Technology (IT)',
    sellerEmail: '21a81a1204@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Admin Block Student Helpdesk Foyer',
    description: 'High-performance ESP-WROOM-32 38-pin version. Perfect for cloud IoT, MQTT telemetry, and web-server labs. Flashed once for final year demo, 100% functional.',
    specs: ['Dual-Core Tensilica Xtensa 32-bit LX6 @ 240 MHz', '520 KB SRAM', '802.11 b/g/n Wi-Fi + BLE 4.2', 'Onboard PCB antenna'],
    recommendedLabs: ['IoT & Embedded Systems Lab', 'Wireless Sensor Networks', 'Cloud Applications Capstone'],
    targetYears: ['3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '3 days ago',
    iconType: 'microcontroller',
    photoUrl: '/assets/images/esp32_devkit_1792860917627.jpg',
    weightGrams: 30,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-008',
    name: 'Arduino Nano V3.0 (Soldered Headers + Mini-USB Cable)',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    transactionType: 'swap',
    samplePrice: 'Swap with ESP8266 or Sensor',
    priceNumeric: 0,
    originalPriceNumeric: 280,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Sanjay Reddy',
    sellerRollNumber: '23A81A4321',
    sellerYear: '2nd Year',
    sellerDept: 'Computer Science and Artificial Intelligence (CAI)',
    sellerEmail: '23a81a4321@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Breadboard-friendly Arduino Nano with ATmega328P. Looking to swap for an ESP8266 NodeMCU or an MPU6050 accelerometer sensor for our CAI hardware lab project.',
    specs: ['ATmega328P @ 16 MHz', '8 Analog Inputs (A0 - A7)', 'Compact 18mm × 45mm footprint', 'Pre-soldered sturdy headers'],
    recommendedLabs: ['Microcontrollers Lab (2nd Yr)', 'CAI Hardware Interface Practicals', 'Wearable Electronics'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Just now',
    iconType: 'microcontroller',
    photoUrl: '/assets/images/arduino_nano_1793034898186.jpg',
    weightGrams: 15,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-009',
    name: 'DHT11 Temperature & Relative Humidity Sensor Module',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹15 / week',
    priceNumeric: 15,
    originalPriceNumeric: 120,
    depositAmount: 30,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Kavya Sree',
    sellerRollNumber: '22A81A0544',
    sellerYear: '3rd Year',
    sellerDept: 'Computer Science & Engineering (CSE)',
    sellerEmail: '22a81a0544@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'CSE Dept - AI & Project Innovation Lab (Block A, 1st Floor)',
    description: '3-pin breakout module with built-in pull-up resistor and power indicator LED. Single-bus digital signal output, compatible with both 3.3V and 5V boards.',
    specs: ['Humidity Range: 20-90% RH', 'Temperature: 0-50°C', 'Sampling Rate: 1 Hz (once per sec)', '3-pin: VCC, GND, DATA'],
    recommendedLabs: ['IoT Lab', 'Embedded Systems (3rd Yr)', 'Weather Monitoring Lab'],
    targetYears: ['2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '2 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/dht11_sensor_1792860918160.jpg',
    weightGrams: 12,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-010',
    name: 'Capacitive Soil Moisture Sensor V1.2 (Corrosion Resistant)',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹20 / week',
    priceNumeric: 20,
    originalPriceNumeric: 150,
    depositAmount: 40,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Rahul Chowdary',
    sellerRollNumber: '22A81A0488',
    sellerYear: '3rd Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '22a81a0488@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    description: 'Capacitive sensing principle prevents probe corrosion in soil, unlike cheap resistive probes. Analog voltage output 1.2V to 3.0V. Tested with 3.3V ADC on ESP32 & Arduino.',
    specs: ['Operating Voltage: 3.3V - 5.5V DC', 'Output Voltage: 0 - 3.0V DC', 'Corrosion-resistant probe coating', '3-pin PH2.0 cable included'],
    recommendedLabs: ['Smart Agriculture Lab', 'IoT Project Work', 'Sensors Practical'],
    targetYears: ['2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '3 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/soil_moisture_sensor_1792860929432.jpg',
    weightGrams: 18,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-011',
    name: 'HC-SR501 PIR Motion Detector Sensor Module (Adjustable Delay)',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'swap',
    samplePrice: 'Swap with IR Sensor or Buzzer',
    priceNumeric: 0,
    originalPriceNumeric: 130,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Manojh Kumar',
    sellerRollNumber: '23A81A0518',
    sellerYear: '2nd Year',
    sellerDept: 'Computer Science & Technology (CST)',
    sellerEmail: '23a81a0518@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Passive Infrared (PIR) sensor for automated lighting and security labs. Dual trimpots on back to calibrate sensitivity (3m - 7m) and output hold time (0.5s - 200s). Looking to swap for active IR sensor.',
    specs: ['Operating Voltage: 4.5V - 20V DC', 'TTL Output: 3.3V High / 0V Low', 'Detection Angle: < 100° cone', 'Auto-repeat triggering mode jumper'],
    recommendedLabs: ['Home Automation Projects', 'Embedded Systems', 'Digital Logic Mini-Labs'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '4 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/pir_sensor_1792860918387.jpg',
    weightGrams: 22,
    testingPeriodHours: 48
  },
  {
    id: 'c2c-012',
    name: 'DT-830D Digital Multimeter with Probes & Transistor Tester',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    transactionType: 'rent',
    samplePrice: '₹35 / week',
    priceNumeric: 35,
    originalPriceNumeric: 320,
    depositAmount: 100,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Tanvi Agarwal',
    sellerRollNumber: '22A81A0219',
    sellerYear: '3rd Year',
    sellerDept: 'Electrical & Electronics Engineering (EEE)',
    sellerEmail: '22a81a0219@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'EEE Dept - Electrical Machines & Power Lab (Block C)',
    description: 'Essential multimeter with brand new 9V battery inside. Tests DCV (200mV-1000V), ACV (200V-750V), DCA (200µA-10A), resistance (200Ω-2MΩ), diode continuity buzzer, and hFE transistor test.',
    specs: ['Includes Red/Black testing leads', 'Continuity beeper buzzer verified', 'Fresh 9V battery pre-installed', 'Overload protection fuse'],
    recommendedLabs: ['All BTech Labs (EEE, ECE, CSE, MECH)', 'Circuits Practical', 'Troubleshooting Projects'],
    targetYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '1 day ago',
    iconType: 'multimeter',
    photoUrl: '/assets/images/multimeter_dt830d_1793035151171.jpg',
    weightGrams: 160,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-013',
    name: 'MPU6050 6-Axis Gyroscope & Accelerometer Sensor Module (I2C Bus)',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹20 / week',
    priceNumeric: 20,
    originalPriceNumeric: 180,
    depositAmount: 40,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Sanjay Reddy',
    sellerRollNumber: '23A81A4321',
    sellerYear: '2nd Year',
    sellerDept: 'Computer Science and Artificial Intelligence (CAI)',
    sellerEmail: '23a81a4321@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Triple-axis MEMS accelerometer and 3-axis gyroscope with onboard Digital Motion Processor (DMP). Communicates over I2C (Address 0x68). Tested with Arduino & ESP32 for orientation tracking and self-balancing robots.',
    specs: ['3-Axis Gyroscope (±250 to ±2000 °/s)', '3-Axis Accelerometer (±2g to ±16g)', '16-bit ADC per channel', 'Operating Voltage: 3.3V - 5V DC'],
    recommendedLabs: ['Sensors Interfacing Lab', 'Robotics & Automation', 'CAI Hardware Practicals'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Today',
    iconType: 'sensor',
    photoUrl: '/assets/images/mpu6050_sensor_1793377419011.jpg',
    weightGrams: 15,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-014',
    name: 'BMP280 Precision Barometric Pressure & Temperature Sensor Module',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'sell',
    samplePrice: '₹80',
    priceNumeric: 80,
    originalPriceNumeric: 190,
    condition: 'Brand New / Sealed',
    sellerName: 'Harish Nair',
    sellerRollNumber: '21A81A0315',
    sellerYear: '4th Year',
    sellerDept: 'Mechanical Engineering (MECH)',
    sellerEmail: '21a81a0315@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Student Canteen Central Plaza',
    description: 'High-precision barometric pressure and temperature breakout board. Ideal for weather forecasting stations, drone altitude control, and indoor navigation labs. Supports I2C (0x76) and SPI.',
    specs: ['Pressure Range: 300 - 1100 hPa (±1 hPa accuracy)', 'Temperature Accuracy: ±1.0°C', 'I2C & SPI dual interface', 'Ultra-low current 2.7µA'],
    recommendedLabs: ['IoT Weather Station', 'Avionics & Drone Labs', 'Fluid Dynamics Measurement'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Yesterday',
    iconType: 'sensor',
    photoUrl: '/assets/images/bmp280_sensor_1793377431764.jpg',
    weightGrams: 10,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-015',
    name: 'MQ-2 Combustible Gas & Smoke Detector Sensor Module',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹25 / week',
    priceNumeric: 25,
    originalPriceNumeric: 160,
    depositAmount: 50,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Divya Krishnan',
    sellerRollNumber: '21A81A1204',
    sellerYear: '4th Year',
    sellerDept: 'Information Technology (IT)',
    sellerEmail: '21a81a1204@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Admin Block Student Helpdesk Foyer',
    description: 'Gas leakage and smoke detector module. Sensitive to LPG, smoke, propane, methane, hydrogen, and alcohol fumes. Features dual outputs (Analog voltage & Digital threshold).',
    specs: ['Detects LPG, Smoke, Propane, Hydrogen', 'Analog (A0) + Digital (D0) outputs', 'Threshold adjustment trimpot', '5V DC operating voltage'],
    recommendedLabs: ['Safety & Alarm Systems', 'IoT Smart Home Lab', 'Environmental Sensing'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '2 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/mq2_gas_sensor_1793377446138.jpg',
    weightGrams: 20,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-016',
    name: 'LDR Light Dependent Resistor Photoresistor Module (with LM393)',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'donate',
    samplePrice: 'Free (Donation)',
    priceNumeric: 0,
    originalPriceNumeric: 90,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Sneha Patel',
    sellerRollNumber: '21A81A0234',
    sellerYear: '4th Year',
    sellerDept: 'Electrical & Electronics Engineering (EEE)',
    sellerEmail: '21a81a0234@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Central Library - Ground Floor Discussion Area',
    description: 'Light detection module for automatic street lights and solar trackers. Sensitive photoresistor combined with LM393 comparator chip and potentiometer sensitivity dial.',
    specs: ['Analog & Digital dual outputs', 'Onboard LM393 voltage comparator', 'Sensitivity adjustment pot', '3.3V - 5V Operating Voltage'],
    recommendedLabs: ['Basic Electronics Lab (1st Yr)', 'Solar Tracking Projects', 'Control Systems'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '3 days ago',
    iconType: 'sensor',
    photoUrl: '/assets/images/ldr_module_1793377458697.jpg',
    weightGrams: 14,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-017',
    name: 'L298N Dual H-Bridge DC & Stepper Motor Driver Board',
    category: 'power_motors',
    categoryLabel: 'Power & Motor Drivers',
    transactionType: 'sell',
    samplePrice: '₹130',
    priceNumeric: 130,
    originalPriceNumeric: 280,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Kalyan Chakravarthy',
    sellerRollNumber: '21A81A0445',
    sellerYear: '4th Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '21a81a0445@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    description: 'High-power motor driver capable of controlling 2 DC motors or 1 bipolar stepper motor. Heavy-duty aluminum heatsink and onboard 5V regulator for powering microcontrollers.',
    specs: ['Driver Voltage: 5V - 35V DC', 'Peak Current: 2A per channel', 'Onboard 5V logic power regulator', 'Screw terminals for easy motor wiring'],
    recommendedLabs: ['Robotics & Mechatronics Lab', 'Motor Control Practicals', 'Automated Systems'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '4 days ago',
    iconType: 'motor',
    photoUrl: '/assets/images/l298n_motor_driver_1793377470717.jpg',
    weightGrams: 35,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-018',
    name: 'TowerPro SG90 9g Micro Servo Motor (180° Rotation)',
    category: 'power_motors',
    categoryLabel: 'Power & Motor Drivers',
    transactionType: 'swap',
    samplePrice: 'Swap with Sensor or Wires',
    priceNumeric: 0,
    originalPriceNumeric: 140,
    condition: 'Gently Used (Tested OK)',
    sellerName: 'Karthik Raja',
    sellerRollNumber: '22A81A0456',
    sellerYear: '3rd Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '22a81a0456@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'Mechanical Workshop & Fabrication Plaza',
    description: 'Lightweight 9g micro servo motor with 1.8 kg/cm torque. Includes 3 plastic servo horns and mounting screws. Tested with Arduino Servo library for robotic grippers and sonar sweepers.',
    specs: ['Stall Torque: 1.8 kg-cm @ 4.8V', 'Operating Speed: 0.12s/60°', '3-Pin Connector (PWM, VCC, GND)', 'Operating Voltage: 4.8V - 6.0V'],
    recommendedLabs: ['Robotics Lab', 'Mechatronics Capstone', 'Embedded Servo Control'],
    targetYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '5 days ago',
    iconType: 'motor',
    photoUrl: '/assets/images/sg90_servo_1793377483096.jpg',
    weightGrams: 12,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-019',
    name: 'MB-102 Half-Size Breadboard (400 Tie) + 65-Pcs M-M Jumper Wire Kit',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    transactionType: 'sell',
    samplePrice: '₹140',
    priceNumeric: 140,
    originalPriceNumeric: 310,
    condition: 'Brand New / Sealed',
    sellerName: 'Rhea Sen',
    sellerRollNumber: '21A81A0589',
    sellerYear: '4th Year',
    sellerDept: 'Computer Science & Engineering (CSE)',
    sellerEmail: '21a81a0589@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'CSE Dept - AI & Project Innovation Lab (Block A, 1st Floor)',
    description: 'Essential lab prototyping bundle with a 400 tie-point solderless breadboard plus 65 flexible multi-color male-to-male jumper wires with sturdy pin ends. Must-have for 1st/2nd year lab practicals.',
    specs: ['400 Tie-Point Breadboard with Power Bus Rails', '65 Multi-length Male-Male Jumper Wires', 'Nickel-plated elastic contacts', 'Compatible with 0.1" DIP components'],
    recommendedLabs: ['Basic Electrical Engineering Lab', 'Digital Logic Design', 'Analog Circuits'],
    targetYears: ['1st Year', '2nd Year', '3rd Year'],
    isAvailable: true,
    status: 'available',
    dateListed: '1 day ago',
    iconType: 'breadboard',
    photoUrl: '/assets/images/breadboard_jumper_kit_1793377495586.jpg',
    weightGrams: 110,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-020',
    name: 'DHT22 / AM2302 High-Accuracy Digital Temperature & Humidity Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'sell',
    samplePrice: '₹160',
    priceNumeric: 160,
    originalPriceNumeric: 320,
    condition: 'Brand New / Sealed',
    sellerName: 'Kavya Sree',
    sellerRollNumber: '22A81A0544',
    sellerYear: '3rd Year',
    sellerDept: 'Computer Science & Engineering (CSE)',
    sellerEmail: '22a81a0544@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'CSE Dept - AI & Project Innovation Lab (Block A, 1st Floor)',
    description: 'Precision digital temperature and humidity sensor module with calibrated digital signal output. Superior range and accuracy compared to DHT11 (-40 to +80°C temp, 0-100% RH). Tested on 3.3V/5V microcontroller digital pins.',
    specs: ['Humidity Range: 0 to 100% RH (±2% RH accuracy)', 'Temperature Range: -40 to +80°C (±0.5°C accuracy)', 'Single-bus digital signal transmission', 'Operating Voltage: 3.3V - 5.5V DC'],
    recommendedLabs: ['IoT Weather Station', 'HVAC Control Systems', 'Embedded Precision Sensing'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Today',
    iconType: 'sensor',
    photoUrl: '/assets/images/dht22_sensor_1793377915491.jpg',
    weightGrams: 16,
    testingPeriodHours: 48,
    isSample: true
  },
  {
    id: 'c2c-021',
    name: 'VL53L0X Time-of-Flight (ToF) Laser Distance Ranging Sensor Module',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    transactionType: 'rent',
    samplePrice: '₹30 / week',
    priceNumeric: 30,
    originalPriceNumeric: 260,
    depositAmount: 60,
    condition: 'Like New (1 Lab Session)',
    sellerName: 'Vikramaditya S.',
    sellerRollNumber: '22A81A0412',
    sellerYear: '3rd Year',
    sellerDept: 'Electronics & Communication Engineering (ECE)',
    sellerEmail: '22a81a0412@srivasaviengg.ac.in',
    sellerShareMobile: false,
    pickupLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    description: 'VCSEL 940nm invisible laser Time-of-Flight millimeter-precise distance sensor. Measures up to 2 meters independent of target color or surface reflectivity. I2C communication (Address 0x29).',
    specs: ['Range: 50mm to 2000mm (±3% precision)', '940nm Eye-safe VCSEL laser light source', 'I2C Interface (Address: 0x29)', 'Operating Voltage: 2.8V - 5.0V DC with level shifter'],
    recommendedLabs: ['Robotics obstacle mapping', 'Gesture recognition', 'Industrial Automation Lab'],
    targetYears: ['2nd Year', '3rd Year', '4th Year'],
    isAvailable: true,
    status: 'available',
    dateListed: 'Yesterday',
    iconType: 'sensor',
    photoUrl: '/assets/images/vl53l0x_sensor_1793377929073.jpg',
    weightGrams: 8,
    testingPeriodHours: 48,
    isSample: true
  }
];
