import { describe, expect, it } from 'vitest';
import { ipDetector } from './ip.js';

describe('ipDetector — IPv4', () => {
  it('detects a basic IPv4', () => {
    const out = ipDetector.detect('server at 192.168.1.1 listening');
    expect(out).toEqual([{ start: 10, end: 21, type: 'IP', value: '192.168.1.1' }]);
  });

  it('detects edge-case octets', () => {
    const out = ipDetector.detect('0.0.0.0 and 255.255.255.255');
    expect(out.map((d) => d.value)).toEqual(['0.0.0.0', '255.255.255.255']);
  });

  it('rejects octets above 255', () => {
    expect(ipDetector.detect('256.0.0.1')).toEqual([]);
    expect(ipDetector.detect('1.2.3.999')).toEqual([]);
  });

  it('does not match 5-octet sequences', () => {
    expect(ipDetector.detect('1.2.3.4.5')).toEqual([]);
  });
});

describe('ipDetector — IPv6', () => {
  it('detects full-form IPv6', () => {
    const out = ipDetector.detect('addr 2001:0db8:85a3:0000:0000:8a2e:0370:7334 end');
    expect(out.map((d) => d.value)).toEqual(['2001:0db8:85a3:0000:0000:8a2e:0370:7334']);
  });

  it('detects compressed IPv6', () => {
    const out = ipDetector.detect('use 2001:db8::1 or fe80::1 today');
    expect(out.map((d) => d.value)).toEqual(['2001:db8::1', 'fe80::1']);
  });

  it('detects loopback ::1', () => {
    const out = ipDetector.detect('ping ::1 now');
    expect(out.map((d) => d.value)).toEqual(['::1']);
  });
});
