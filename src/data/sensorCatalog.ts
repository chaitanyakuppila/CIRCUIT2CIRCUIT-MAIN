import { ComponentCategory, ComponentItem } from '../types';

export interface VerifiedSensor {
  id: string;
  name: string;
  category: ComponentCategory;
  categoryLabel: string;
  iconType: ComponentItem['iconType'];
  aliases: string[];
  defaultSpecs: string[];
  defaultLabs: string[];
  defaultDescription: string;
}

export const VERIFIED_SENSOR_CATALOG: VerifiedSensor[] = [
  {
    id: 'sensor-hcsr04',
    name: 'HC-SR04 Ultrasonic Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['ultrasonic', 'ultra', 'distance', 'sonar', 'hc-sr04', 'hcsro4', 'hc sr04', 'range', 'proximity', 'sound wave', 'distance sensor'],
    defaultSpecs: ['Operating Voltage: 5V DC', 'Working Current: 15mA', 'Measuring Range: 2cm to 400cm', 'Measuring Angle: 15 degrees', 'Trigger Input: 10µs TTL pulse'],
    defaultLabs: ['Microprocessor & Microcontroller Lab', 'IoT & Embedded Systems Lab', 'Robotics & Mini Projects'],
    defaultDescription: 'Tested HC-SR04 ultrasonic distance measurement module with dual transducers (Transmitter and Receiver). Accurate non-contact distance sensing from 2cm to 4m.',
  },
  {
    id: 'sensor-dht11',
    name: 'DHT11 Temperature and Humidity Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['dht11', 'dht 11', 'dht-11', 'temperature', 'humidity', 'temp', 'hum', 'climate', 'dht22', 'weather', 'temp sensor'],
    defaultSpecs: ['Operating Voltage: 3.3V to 5.5V', 'Temperature Range: 0°C to 50°C (±2°C accuracy)', 'Humidity Range: 20% to 90% RH (±5% accuracy)', 'Single-bus digital signal output'],
    defaultLabs: ['IoT & Embedded Systems Lab', 'Sensor Technology Practical', 'Mini Projects'],
    defaultDescription: 'Composite temperature and humidity sensor module with calibrated digital signal output. Easy single-wire interface for Arduino and ESP32 microcontroller boards.',
  },
  {
    id: 'sensor-pir',
    name: 'PIR Motion Sensor (HC-SR501)',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['pir', 'motion', 'hc-sr501', 'hcsr501', 'hc sr501', 'pir sensor', 'fresnel', 'infrared', 'presence', 'human motion', 'occupancy', 'body sensor'],
    defaultSpecs: ['Operating Voltage: 4.5V to 20V DC', 'Detection Distance: Up to 7 meters (adjustable)', 'Sensing Angle: < 120 degree cone', 'Adjustable delay time (0.3s - 200s) and sensitivity pots'],
    defaultLabs: ['IoT & Embedded Systems Lab', 'Home Automation Mini Projects', 'Security Systems Lab'],
    defaultDescription: 'Pyroelectric passive infrared motion sensor with white Fresnel dome lens. Features adjustable sensitivity and delay potentiometers for human motion detection.',
  },
  {
    id: 'sensor-soil',
    name: 'Soil Moisture Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['soil', 'moisture', 'soil moisture', 'water', 'hygrometer', 'plant', 'irrigation', 'soil probe', 'moisture sensor', 'agriculture'],
    defaultSpecs: ['Operating Voltage: 3.3V to 5V', 'Dual Output Mode: Analog (accurate) & Digital (threshold)', 'Corrosion-resistant probe pins', 'LM393 comparator chip on control board'],
    defaultLabs: ['Smart Agriculture Projects', 'IoT Lab', 'Sensor & Instrumentation Lab'],
    defaultDescription: 'Soil moisture detection probe module with LM393 comparator board. Provides both analog voltage readout and digital threshold output for automated plant watering systems.',
  },
  {
    id: 'sensor-ir-obstacle',
    name: 'IR Obstacle Avoidance Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['ir', 'obstacle', 'infrared', 'avoidance', 'proximity', 'line follower', 'tcrt5000', 'ir sensor', 'ky-032', 'obstacle sensor', 'optical sensor'],
    defaultSpecs: ['Operating Voltage: 3.3V to 5V DC', 'Detection Distance: 2cm to 30cm (adjustable via trimpot)', 'Detection Angle: 35 degrees', 'Active high/low digital output indicator LED'],
    defaultLabs: ['Robotics Lab', 'Line Follower Robot Projects', 'Embedded Systems Lab'],
    defaultDescription: 'Infrared reflective obstacle avoidance sensor module with transmitter IR LED and phototransistor receiver pair. Ideal for robot car obstacle detection and line tracking.',
  },
  {
    id: 'mcu-arduino-uno',
    name: 'Arduino Uno R3 Microcontroller Board',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    iconType: 'microcontroller',
    aliases: ['arduino', 'uno', 'r3', 'arduino uno', 'atmega328p', 'microcontroller', 'uno r3', 'dev board'],
    defaultSpecs: ['ATmega328P @ 16 MHz', '14 Digital I/O Pins (6 PWM output)', '6 Analog Inputs', 'Operating Voltage: 5V', 'USB Type-B interface with CH340 / 16U2'],
    defaultLabs: ['Basic Electrical & Electronics Lab (1st Yr)', 'Microprocessor & Microcontroller Lab (2nd/3rd Yr)', 'Capstone Projects'],
    defaultDescription: 'Standard ATmega328P microcontroller evaluation board. Tested and fully functional with bootloader installed for Arduino IDE programming.',
  },
  {
    id: 'mcu-esp32',
    name: 'ESP32 NodeMCU Wi-Fi & Bluetooth Module',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    iconType: 'microcontroller',
    aliases: ['esp32', 'esp-32', 'nodemcu', 'wifi', 'bluetooth', 'iot', 'wireless', 'esp32-wroom', 'dual core'],
    defaultSpecs: ['Xtensa Dual-Core 32-bit LX6 @ 240 MHz', 'Built-in 2.4 GHz Wi-Fi (802.11 b/g/n) & Bluetooth v4.2 BR/EDR/BLE', '520 KB SRAM / 4MB Flash', 'CP2102 / CH340 USB-to-UART bridge'],
    defaultLabs: ['Internet of Things (IoT) Lab', 'Advanced Wireless Systems', 'Cloud Connected Mini Projects'],
    defaultDescription: 'Powerful 32-bit Wi-Fi and Bluetooth development board. Supports Arduino IDE, MicroPython, and ESP-IDF for IoT cloud and web server applications.',
  },
  {
    id: 'mcu-stm32',
    name: 'STM32F103C8T6 Blue Pill Board',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    iconType: 'microcontroller',
    aliases: ['stm32', 'blue pill', 'stm32f103', 'arm cortex', 'cortex m3', 'stm'],
    defaultSpecs: ['ARM Cortex-M3 32-bit CPU @ 72 MHz', '64 KB Flash / 20 KB SRAM', 'USB Micro-B Port', '37 GPIO Pins, 2x SPI, 2x I2C, 3x USART'],
    defaultLabs: ['Advanced Microcontrollers Lab', 'Real-Time Embedded Systems Lab'],
    defaultDescription: 'High-performance 32-bit ARM Cortex-M3 microcontroller board. Ideal for real-time control, signal processing, and advanced lab coursework.',
  },
  {
    id: 'mcu-raspberry-pico',
    name: 'Raspberry Pi Pico Board',
    category: 'microcontrollers',
    categoryLabel: 'Microcontrollers',
    iconType: 'microcontroller',
    aliases: ['pico', 'raspberry pi pico', 'rp2040', 'micropython', 'pico w'],
    defaultSpecs: ['RP2040 Dual-core ARM Cortex M0+ @ 133MHz', '264KB SRAM / 2MB Flash', '26 Multi-function GPIO pins', '2x SPI, 2x I2C, 2x UART, 16x PWM'],
    defaultLabs: ['Python Programming Lab', 'Embedded Systems Practical'],
    defaultDescription: 'Raspberry Pi RP2040 microcontroller board. Supports MicroPython and C/C++ SDKs for fast embedded prototyping.',
  },
  {
    id: 'sensor-mq2',
    name: 'MQ-2 Gas and Smoke Sensor',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['mq2', 'mq-2', 'gas', 'smoke', 'air quality', 'lpg', 'methane', 'combustible gas'],
    defaultSpecs: ['Operating Voltage: 5V DC', 'Detects LPG, Smoke, Alcohol, Propane, Hydrogen, Methane', 'Dual Output: Analog voltage & Digital threshold', 'Adjustable sensitivity trimpot'],
    defaultLabs: ['Environmental Monitoring Lab', 'Safety & IoT Mini Projects'],
    defaultDescription: 'Semiconductor gas sensor module sensitive to LPG, i-butane, propane, methane, alcohol, Hydrogen, and smoke.',
  },
  {
    id: 'sensor-mpu6050',
    name: 'MPU-6050 6-Axis Gyroscope and Accelerometer',
    category: 'sensors',
    categoryLabel: 'Sensors & Modules',
    iconType: 'sensor',
    aliases: ['mpu6050', 'mpu-6050', 'gyro', 'gyroscope', 'accelerometer', 'imu', '6-axis', 'tilt', 'orientation'],
    defaultSpecs: ['Chip: MPU-6050', 'Power Supply: 3V-5V DC', 'Communication Mode: Standard I2C protocol', 'Built-in 16-bit AD converter with Digital Motion Processor (DMP)'],
    defaultLabs: ['Robotics & Drone Mini Projects', 'Mechatronics Lab', 'Physics & Dynamics Lab'],
    defaultDescription: 'Integrated 3-axis MEMS accelerometer and 3-axis MEMS gyroscope module with onboard Digital Motion Processor (DMP).',
  },
  {
    id: 'driver-l298n',
    name: 'L298N Dual H-Bridge Motor Driver Module',
    category: 'power_motors',
    categoryLabel: 'Power & Motors',
    iconType: 'motor',
    aliases: ['l298n', 'motor driver', 'h-bridge', 'l298', 'dc motor driver', 'stepper driver', 'l298n module'],
    defaultSpecs: ['Driver Chip: L298N Dual H-Bridge', 'Motor Supply Voltage: 5V to 35V', 'Peak Current: 2A per bridge', 'Onboard 78M05 5V linear regulator'],
    defaultLabs: ['Robotics & Motor Control Lab', 'Automated Vehicle Projects'],
    defaultDescription: 'Dual H-bridge motor driver module capable of controlling two DC motors or one 4-wire two-phase stepper motor with speed (PWM) and direction control.',
  },
  {
    id: 'display-lcd1602',
    name: '16x2 LCD Display Module with I2C Interface',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    iconType: 'display',
    aliases: ['lcd', '16x2', 'display', 'i2c', 'lcd1602', 'screen', 'character display', 'pcf8574'],
    defaultSpecs: ['16 Characters x 2 Lines Display', 'Operating Voltage: 5V DC', 'Includes PCF8574 I2C Serial Backpack (Address 0x27 or 0x3F)', 'Blue backlight with white text'],
    defaultLabs: ['Microcontroller Lab', 'IoT Status Display Projects'],
    defaultDescription: '16x2 character alphanumeric LCD module pre-soldered with an I2C adapter backpack, requiring only 2 data wires (SDA/SCL) to operate.',
  },
  {
    id: 'display-oled',
    name: 'OLED 0.96 inch I2C Display Module',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    iconType: 'display',
    aliases: ['oled', '0.96', 'ssd1306', 'i2c display', 'small screen', 'graphic display', '128x64'],
    defaultSpecs: ['Resolution: 128 x 64 pixels', 'Display Color: Blue / White on Black', 'Driver IC: SSD1306', 'Interface: I2C (VCC, GND, SCL, SDA)'],
    defaultLabs: ['Advanced IoT Projects', 'Wearable Electronics Lab'],
    defaultDescription: 'Monochrome 0.96-inch graphic OLED display module with SSD1306 controller. High contrast, low power, crisp self-illuminating pixels.',
  },
  {
    id: 'proto-breadboard',
    name: '830 Point Solderless Breadboard',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    iconType: 'breadboard',
    aliases: ['breadboard', 'mb-102', 'tie points', 'prototyping', 'solderless', 'circuit board'],
    defaultSpecs: ['830 Total Tie Points (630 IC area + 200 power rails)', 'Standard 0.1" (2.54mm) pin spacing', 'Self-adhesive foam backing pad'],
    defaultLabs: ['Basic Electrical Lab (1st Yr)', 'Analog & Digital Circuits Lab'],
    defaultDescription: 'Solderless breadboard MB-102 with firm nickel-plated spring contacts and dual power bus rails.',
  },
  {
    id: 'proto-jumpers',
    name: 'Male-to-Male / Male-to-Female Jumper Wires Pack',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    iconType: 'wires',
    aliases: ['jumper', 'wires', 'dupont', 'ribbon cable', 'male to female', 'jumper wires', 'm-m', 'm-f', 'f-f'],
    defaultSpecs: ['Standard 2.54mm (0.1") Dupont header connectors', 'Length: 20cm / 8 inches', 'Stranded copper core with high flexibility PVC insulation'],
    defaultLabs: ['All BTech Engineering Practical Labs'],
    defaultDescription: '40-pin multicolor Dupont ribbon jumper cables for breadboards, sensors, and microcontroller pin headers.',
  },
  {
    id: 'motor-servo-sg90',
    name: 'SG90 Micro Servo Motor',
    category: 'power_motors',
    categoryLabel: 'Power & Motors',
    iconType: 'motor',
    aliases: ['sg90', 'servo', 'micro servo', 'motor', '9g servo', 'steering servo'],
    defaultSpecs: ['Weight: 9 grams', 'Operating Voltage: 4.8V to 6.0V', 'Stall Torque: 1.8 kg-cm @ 4.8V', 'Rotation Angle: 180 degrees'],
    defaultLabs: ['Robotics Lab', 'Mechatronics & Steering Projects'],
    defaultDescription: 'Lightweight 9g analog micro servo motor with 3-pin connector (PWM signal, VCC, GND) and horn attachments.',
  },
  {
    id: 'power-relay',
    name: '5V Single Channel Relay Module',
    category: 'power_motors',
    categoryLabel: 'Power & Motors',
    iconType: 'motor',
    aliases: ['relay', '5v relay', 'switch', 'optocoupler', 'high voltage', 'relay module'],
    defaultSpecs: ['Control Signal: 5V TTL Digital', 'Maximum Load: AC 250V/10A, DC 30V/10A', 'Optocoupler isolation for microcontroller protection'],
    defaultLabs: ['Home Automation Projects', 'High Power Control Lab'],
    defaultDescription: '5V single channel relay board with optocoupler isolation, status indicator LED, and screw terminal output blocks.',
  },
  {
    id: 'tool-multimeter',
    name: 'Digital Multimeter Probe Kit',
    category: 'prototyping',
    categoryLabel: 'Prototyping & Lab Tools',
    iconType: 'multimeter',
    aliases: ['multimeter', 'voltmeter', 'tester', 'probes', 'continuity', 'dt830d', 'voltage tester'],
    defaultSpecs: ['Measures AC/DC Voltage, DC Current, Resistance, Diode Test & Continuity Buzzer', 'Overload protection on all ranges'],
    defaultLabs: ['All Electrical & Physics Laboratories'],
    defaultDescription: 'Compact digital multimeter tool with red/black probe leads for circuit debugging, voltage testing, and continuity checks.',
  },
];

/**
 * Searches the verified sensor catalog matching partial words, exact prefix, or alias keywords.
 */
export function searchSensorCatalog(query: string, maxResults = 8): VerifiedSensor[] {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim().toLowerCase();
  if (clean.length === 0) return [];

  const tokens = clean.split(/\s+/).filter((t) => t.length > 0);

  const scored = VERIFIED_SENSOR_CATALOG.map((item) => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const aliasStr = item.aliases.join(' ').toLowerCase();

    // 1. Exact or prefix match on full name
    if (nameLower === clean) score += 100;
    else if (nameLower.startsWith(clean)) score += 80;
    else if (nameLower.includes(clean)) score += 50;

    // 2. Exact or prefix match on aliases
    item.aliases.forEach((alias) => {
      const aLower = alias.toLowerCase();
      if (aLower === clean) score += 90;
      else if (aLower.startsWith(clean)) score += 70;
      else if (aLower.includes(clean)) score += 40;
    });

    // 3. Token-based matching (e.g. "ultra distance" or "dht temp")
    let matchedTokens = 0;
    tokens.forEach((token) => {
      if (nameLower.includes(token) || aliasStr.includes(token)) {
        matchedTokens += 1;
        score += 20;
      }
    });

    // Bonus if all tokens match
    if (tokens.length > 1 && matchedTokens === tokens.length) {
      score += 40;
    }

    return { item, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((entry) => entry.item);
}
